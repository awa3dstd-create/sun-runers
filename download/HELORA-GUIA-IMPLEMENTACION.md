# HELORA — Guía de Implementación y Automatización

Documento de referencia para implementar el sitio en producción y construir la capa de automatización (WhatsApp, email y asignación por proximidad) sobre Cloudflare.

---

## 1. Arquitectura actual del proyecto

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Next.js 16)                                        │
│ - Single-page con secciones ancladas                         │
│ - UI ultra-pro minimalista (paleta warm + accent amber)      │
│ - Formulario de contacto con validación Zod                  │
└─────────────────────────┬───────────────────────────────────┘
                          │ POST /api/contact
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ API Route (Next.js)                                          │
│ - Valida payload                                             │
│ - Calcula ingeniero más cercano (haversine)                 │
│ - Persiste en SQLite (Prisma)                               │
│ - Registra log de auditoría                                  │
└─────────────────────────┬───────────────────────────────────┘
                          │ Insert ContactRequest (status='nuevo')
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Base de datos (SQLite / futura: Cloudflare D1)              │
│ - ContactRequest: datos del cliente + ingeniero asignado    │
│ - AutomationLog: trazabilidad de acciones                   │
└─────────────────────────────────────────────────────────────┘
```

### Archivos clave

| Archivo | Rol |
|---|---|
| `src/app/page.tsx` | Composición de todas las secciones |
| `src/lib/site-data.ts` | Datos públicos + **datos privados de ingenieros** |
| `src/lib/engineer-assignment.ts` | Algoritmo de proximidad por provincias |
| `src/app/api/contact/route.ts` | Endpoint de contacto |
| `prisma/schema.prisma` | Modelos de datos |
| `src/components/site/*` | Componentes de UI (Header, Hero, Services, etc.) |

### ⚠️ Datos privados

Las direcciones, teléfonos y emails de ingenieros viven en `ENGINEERS_PRIVATE` dentro de `src/lib/site-data.ts`. **Nunca se importan desde componentes cliente**. Solo el endpoint `/api/contact` los usa en servidor para calcular la asignación.

Cuando subas un ingeniero real, actualiza:
1. `ENGINEERS_PUBLIC` con foto, biografía, especialidades (visible en web)
2. `ENGINEERS_PRIVATE` con coordenadas, zona, teléfono y email (oculto)

---

## 2. Despliegue en Cloudflare Pages

### 2.1 Build del proyecto

El proyecto ya está configurado para producción con Next.js 16 standalone output. Para Cloudflare:

```bash
# Instalar wrangler CLI
bun add -g wrangler

# Iniciar sesión
wrangler login
```

### 2.2 Configuración `wrangler.toml`

Crear en la raíz del proyecto:

```toml
name = "helora"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".next/standalone"

[vars]
NODE_ENV = "production"
WHATSAPP_API_URL = "https://graph.facebook.com/v18.0"
NEXT_PUBLIC_SITE_URL = "https://helora.pages.dev"
```

### 2.3 Migración de SQLite a Cloudflare D1

La base de datos actual usa SQLite local. Para producción en Cloudflare, migrar a **D1** (SQLite distribuido de Cloudflare):

```bash
# Crear base de datos D1
wrangler d1 create helora-db

# Esto genera un ID. Añadir a wrangler.toml:
# [[d1_databases]]
# binding = "DB"
# database_name = "helora-db"
# database_id = "<id_generado>"
```

Luego actualizar `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Y generar el cliente con el adapter de D1:
```bash
bun add @prisma/adapter-d1
```

Crear `src/lib/db.ts` adaptado:

```typescript
import { PrismaD1 } from '@prisma/adapter-d1'
import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient({
  adapter: new PrismaD1(env.DB),
})
```

### 2.4 Variables de entorno

Configurar en `.env.local` (desarrollo) y en el dashboard de Cloudflare Pages (producción):

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | URL de base de datos | `file:./db/custom.db` (dev) / `prisma://...` (D1 prod) |
| `BREVO_API_KEY` | API key de Brevo | `xkeysib-...` |
| `BREVO_FROM_EMAIL` | Email remitente verificado en Brevo | `helora.cuba@gmail.com` |
| `BREVO_FROM_NAME` | Nombre remitente | `HELORA` |
| `BREVO_NOTIFY_EMAIL` | Email central que recibe copia interna | `helora.cuba@gmail.com` |
| `WHATSAPP_PUBLIC_NUMBER` | WhatsApp público para clientes | `+5351234567` |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio | `http://localhost:3000` (dev) / `https://helora.cu` (prod) |
| `GEOCODING_API_KEY` | API key de geocoding (opcional) | (Nominatim/Google) |
| `WHATSAPP_TOKEN` | Token de WhatsApp Business API (futuro) | `EAAG...` |
| `WHATSAPP_PHONE_NUMBER_ID` | ID de WhatsApp Business (futuro) | `123456789` |

Ver `.env.example` en la raíz del proyecto como plantilla.

### 2.5 Despliegue

```bash
# Conectar el repo a Cloudflare Pages vía dashboard, o:
wrangler pages deploy .next/standalone
```

---

## 3. Email transaccional con Brevo

### 3.1 ¿Por qué Brevo y no Resend?

| Servicio | Plan free | Dominio propio | Envío hacia Gmail |
|---|---|---|---|
| **Resend** | 3000/mes | **Requerido** | Solo desde dominio verificado |
| **Brevo** | 300/día (9000/mes) | **No requerido** | Sí, desde Gmail verificado |
| Mailgun | 100/día | Requerido tras 1er mes | Sí |
| Elastic Email | 100/día | No requerido | Sí |

Para la fase actual de HELORA **sin dominio propio**, **Brevo** es la mejor opción porque permite enviar desde un Gmail personal verificado hacia cualquier destinatario Gmail. Cuando la empresa tenga dominio `helora.cu`, se puede migrar a Resend (mayor cuota y mejor deliverability con dominio propio).

### 3.2 Configurar Brevo paso a paso

1. **Crear cuenta**: ir a https://www.brevo.com → *Sign up free*
2. **Completar perfil**: nombre, país (Cuba no está — seleccionar España, México o USA)
3. **Verificar email remitente**:
   - Ir a *Senders & IP* → *Senders* → *Add a new sender*
   - Email: `helora.cuba@gmail.com` (tu Gmail personal o dedicado)
   - Name: `HELORA`
   - Brevo enviará un email de verificación a esa dirección
   - Abrir el email y hacer clic en "Verify"
4. **Generar API key**:
   - Ir a *Settings* → *API Keys* → *Generate API key*
   - Nombre: `HELORA Web`
   - Permisos: *Sending* (solo enviar)
   - Copiar la key (empieza con `xkeysib-`)
5. **Pegar API key en `.env.local`**:
   ```bash
   BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxx
   BREVO_FROM_EMAIL=helora.cuba@gmail.com
   BREVO_FROM_NAME=HELORA
   BREVO_NOTIFY_EMAIL=helora.cuba@gmail.com
   WHATSAPP_PUBLIC_NUMBER=+5351234567
   ```
6. **Verificar configuración**:
   ```bash
   curl http://localhost:3000/api/health
   ```
   Debe responder:
   ```json
   {
     "hasApiKey": true,
     "fromEmail": "helora.cuba@gmail.com",
     "fromName": "HELORA",
     "notifyEmail": "helora.cuba@gmail.com",
     "whatsappPublic": "+5351234567",
     "allConfigured": true
   }
   ```

### 3.3 Flujo de emails automático

Cuando un cliente envía el formulario de contacto, el endpoint `/api/contact` ejecuta:

```
1. Persistir solicitud en DB (status='nuevo')
       │
2. Calcular ingeniero más cercano por proximidad
       │
3. Enviar email al CLIENTE (confirmación cálido)
   - Asunto: "HELORA — Recibimos tu solicitud"
   - Contenido: confirmación + zona asignada + CTA WhatsApp
   - Tags: ["contacto-cliente", "<servicio>"]
       │
4. Enviar email al INGENIERO ASIGNADO (notificación interna)
   - Asunto: "[HELORA] Nueva solicitud #ABC12345 — fotovoltaico"
   - Contenido: todos los datos del cliente + mensaje
   - Tags: ["notificacion-interna", "ing-X"]
       │
5. Enviar COPIA al email central de la compañía
   - Asunto: "[COPIA] [HELORA] Nueva solicitud #..."
   - Mismo contenido que el email del ingeniero
       │
6. Actualizar status='notificado' y emailSent=true
       │
7. Registrar AutomationLog por cada acción
```

### 3.4 Plantillas de email

Dos plantillas HTML embebidas en `src/lib/email-templates.ts`:

- **`buildClientConfirmationEmail`**: email cálido al cliente con logo HELORA, bloque "Qué sigue", CTA WhatsApp
- **`buildEngineerNotificationEmail`**: email interno con tabla de datos del cliente, mensaje destacado, link directo a `mailto:` y `tel:`

Ambas usan HTML tabular con estilos inline (estándar para email transaccional — Gmail/Outlook no soportan CSS moderno).

### 3.5 Diagnóstico y troubleshooting

**Problema**: "Los emails no llegan"
1. Verificar `/api/health` → `allConfigured: true`
2. Revisar logs en DB: `SELECT * FROM AutomationLog ORDER BY createdAt DESC LIMIT 20`
3. Revisar el dashboard de Brevo → *Transactional* → *Logs* para ver si Brevo recibió la solicitud
4. Verificar que el email remitente esté verificado en Brevo (no solo agregado, sino verificado con el click del email de confirmación)
5. Revisar carpeta Spam del destinatario (los primeros envíos desde Gmail vía Brevo pueden ir a spam hasta que se establezca reputación)

**Problema**: "Brevo responde 401 Unauthorized"
- La API key es incorrecta o expiró. Regenerarla en Brevo → *API Keys*.

**Problema**: "Brevo responde 400 con 'sender not allowed'"
- El email remitente (`BREVO_FROM_EMAIL`) no está verificado en Brevo. Repetir el paso 3.3.

**Problema**: "Límite de 300 emails/día excedido"
- Brevo free tier permite 300/día. Para HELORA esto es suficiente (más de 300 solicitudes/día requeriría plan pago). Si se excede, Brevo pausa el envío hasta el día siguiente — las solicitudes quedan persistidas en DB con `emailSent=false` y se pueden procesar manualmente o con un Worker de reintentos.

### 3.6 Migración futura a Resend (cuando tengas dominio)

Cuando HELORA tenga dominio propio (`helora.cu`):

1. Migrar a Resend — mayor cuota (3000/mes) y mejor deliverability
2. Configurar registros DNS (SPF, DKIM, DMARC)
3. Cambiar `src/lib/brevo.ts` por `src/lib/resend.ts` (la API es similar)
4. Actualizar variables de entorno: `RESEND_API_KEY`, `EMAIL_FROM=contacto@helora.cu`

---

## 4. Capa de automatización (futura — WhatsApp + Workers)

### 4.1 Arquitectura propuesta

```
Cliente envía formulario
        │
        ▼
/api/contact  ──►  DB ContactRequest (status='nuevo')
                          │
                          ▼
              ┌───────────────────────────┐
              │ Cloudflare Worker          │
              │ (cron cada 1 minuto)       │
              │                            │
              │ - SELECT WHERE status=     │
              │   'nuevo'                  │
              │ - Para cada solicitud:     │
              │   1. Lookup ingeniero      │
              │      asignado              │
              │   2. WhatsApp API →        │
              │      notificar al cliente  │
              │   3. WhatsApp API →        │
              │      notificar al ingeniero│
              │   4. Email al cliente +    │
              │      ingeniero             │
              │   5. UPDATE status=        │
              │      'notificado'          │
              └───────────────────────────┘
```

### 4.2 Worker de automatización

Crear `workers/automation/index.ts`:

```typescript
// workers/automation/index.ts
import { Router } from 'itty-router'

interface Env {
  DB: D1Database
  WHATSAPP_TOKEN: string
  WHATSAPP_PHONE_NUMBER_ID: string
  EMAIL_API_KEY: string
  EMAIL_FROM: string
}

const router = Router()

// Endpoint público para testing manual
router.get('/health', () => new Response('OK'))

// Cron trigger (configurado en wrangler.toml)
router.post('/run', async (request, env: Env) => {
  const newRequests = await env.DB.prepare(
    `SELECT * FROM ContactRequest WHERE status = 'nuevo' LIMIT 10`
  ).all()

  for (const req of newRequests.results) {
    await processRequest(req, env)
  }

  return Response.json({ processed: newRequests.results.length })
})

async function processRequest(req: any, env: Env) {
  // 1. Lookup del ingeniero asignado (datos privados en código del worker)
  const engineer = ENGINEERS_PRIVATE.find(e => e.id === req.assignedEngineerId)
  if (!engineer) return

  // 2. WhatsApp al cliente (confirmación)
  await sendWhatsApp(env, req.phone, {
    template: 'hello_world',
    components: [{
      type: 'body',
      parameters: [
        { type: 'text', text: req.name },
        { type: 'text', text: engineer.coverageZone }
      ]
    }]
  })

  // 3. WhatsApp al ingeniero (notificación interna)
  await sendWhatsApp(env, engineer.whatsapp, {
    text: `🔧 Nueva solicitud asignada\n\n` +
          `Cliente: ${req.name}\n` +
          `Teléfono: ${req.phone}\n` +
          `Dirección: ${req.address}\n` +
          `Servicio: ${req.service}\n` +
          `Mensaje: ${req.message}\n` +
          `Zona: ${engineer.coverageZone}`
  })

  // 4. Email de confirmación al cliente
  await sendEmail(env, req.email, {
    subject: 'HELORA — Solicitud recibida',
    html: `<p>Hola ${req.name},</p>
           <p>Tu solicitud fue asignada a nuestro equipo en ${engineer.coverageZone}.</p>
           <p>Te contactaremos en menos de 24 horas hábiles.</p>`
  })

  // 5. Actualizar estado
  await env.DB.prepare(
    `UPDATE ContactRequest SET status = 'notificado', 
     whatsappSent = 1, emailSent = 1, updatedAt = ? 
     WHERE id = ?`
  ).bind(Date.now(), req.id).run()

  // 6. Log
  await env.DB.prepare(
    `INSERT INTO AutomationLog (id, requestId, action, detail, success, createdAt)
     VALUES (?, ?, 'whatsapp_sent', ?, 1, ?)`
  ).bind(crypto.randomUUID(), req.id, `WhatsApp enviado a ${req.phone}`, Date.now()).run()
}

async function sendWhatsApp(env: Env, to: string, payload: any) {
  const url = `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, ...payload })
  })
}

async function sendEmail(env: Env, to: string, payload: any) {
  // Usar Resend (https://resend.com) — API simple y gratuita hasta 3000/mes
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to,
      subject: payload.subject,
      html: payload.html
    })
  })
}

// Datos privados de ingenieros (duplicados del frontend, nunca expuestos)
const ENGINEERS_PRIVATE = [
  { id: 'ing-1', whatsapp: '+53500000001', coverageZone: 'La Habana — Centro y Oeste' },
  // ... actualizar con datos reales
]

export default {
  fetch: router.handle,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(processNewRequests(env))
  }
}

async function processNewRequests(env: Env) {
  await fetch('https://helora.cu/api/automation/run', {
    method: 'POST',
    headers: { 'X-Internal-Secret': env.INTERNAL_SECRET }
  })
}
```

`wrangler.toml` del worker:

```toml
name = "helora-automation"
main = "workers/automation/index.ts"
compatibility_date = "2025-01-01"

[triggers]
crons = ["* * * * *"]  # Cada minuto

[[d1_databases]]
binding = "DB"
database_name = "helora-db"
database_id = "<id>"

[vars]
INTERNAL_SECRET = "genera-un-secreto-largo"
```

### 4.3 WhatsApp Business API

Pasos para conectar WhatsApp Business:

1. **Crear cuenta en Meta Business** → https://business.facebook.com
2. **Verificar el negocio** (documentos legales de la compañía)
3. **Crear una app de WhatsApp Business** en https://developers.facebook.com
4. **Solicitar acceso a la API oficial** (proceso de revisión 1-7 días)
5. **Configurar número de teléfono** dedicado para la empresa
6. **Crear plantillas de mensajes** aprobadas por Meta:
   - `hello_world` (confirmación de recepción)
   - `appointment_reminder` (recordatorio de visita)
   - `quote_ready` (cotización lista)
7. **Obtener token permanente**:
   - `WHATSAPP_TOKEN` — token de acceso a la API
   - `WHATSAPP_PHONE_NUMBER_ID` — ID del número de teléfono

### 4.4 Email transaccional

⚠️ **Ya implementado con Brevo** — ver sección 3 arriba. El Worker futuro solo necesitaría manejar los reintentos y los casos donde `emailSent=false` (por ejemplo, si Brevo estuvo caído).

Recomendación: **Resend** (https://resend.com) — 3000 emails/mes gratis, API simple.

1. Crear cuenta en Resend
2. Verificar dominio `helora.cu` (añadir registros DNS)
3. Generar API key → `EMAIL_API_KEY`
4. Configurar email remitente → `EMAIL_FROM=contacto@helora.cu`

Alternativas: SendGrid, Mailgun, Postmark, Amazon SES.

---

## 5. Geocoding real (mejora opcional)

Actualmente el algoritmo de proximidad infiere coordenadas del cliente desde el texto de la dirección (matching por municipio/provincia). Para mayor precisión:

### 5.1 Nominatim (gratuito, OpenStreetMap)

```typescript
async function geocode(address: string): Promise<{lat:number, lng:number} | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=cu`
  const res = await fetch(url, { headers: { 'User-Agent': 'HELORA/1.0' } })
  const data = await res.json()
  return data[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null
}
```

### 5.2 Google Maps Geocoding API (de pago, más preciso)

```typescript
async function geocode(address: string, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:CU&key=${apiKey}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.results[0]) {
    const { lat, lng } = data.results[0].geometry.location
    return { lat, lng }
  }
  return null
}
```

Integrar en `/api/contact` antes de llamar a `assignNearestEngineer`:

```typescript
const coords = await geocode(body.address, env.GEOCODING_API_KEY)
const assignment = assignNearestEngineer(body.address, coords?.lat, coords?.lng)
```

---

## 6. Agentes IA / MCP (futuro)

Cuando quieras añadir IA al flujo, dos arquitecturas posibles:

### 6.1 Cloudflare Workers AI (recomendado, serverless)

Cloudflare tiene modelos LLM ejecutándose en su edge network. Para crear un agente que:

- Responda preguntas frecuentes del cliente por WhatsApp
- Genere cotizaciones preliminares
- Clasifique urgencia de la solicitud

```typescript
// workers/ai-agent/index.ts
interface Env {
  AI: Ai  // binding nativo de Cloudflare Workers AI
  DB: D1Database
}

export default {
  async fetch(request: Request, env: Env) {
    const { message, requestId } = await request.json()
    
    // Obtener contexto de la solicitud
    const req = await env.DB.prepare(
      `SELECT * FROM ContactRequest WHERE id = ?`
    ).bind(requestId).first()

    // Llamar al modelo
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'Eres un asistente de HELORA, empresa de ingeniería eléctrica en Cuba. Responde en español, sé breve y profesional.' },
        { role: 'user', content: `Solicitud: ${JSON.stringify(req)}\nPregunta del cliente: ${message}` }
      ]
    })

    return Response.json({ response })
  }
}
```

### 6.2 MCP (Model Context Protocol)

Si quieres usar un LLM externo (GPT-5, Claude) con herramientas (MCP tools) que pueda:

- Consultar solicitudes en la DB
- Asignar ingenieos manualmente
- Reenviar notificaciones
- Generar reportes

Arquitectura:

```
┌────────────────┐     MCP      ┌──────────────────────┐
│ Claude Desktop │ ◄──────────► │ MCP Server (Node)     │
│                │              │ - tool: list_requests │
│                │              │ - tool: assign_engineer│
│                │              │ - tool: send_whatsapp │
│                │              │ - tool: generate_quote│
└────────────────┘              └──────────────────────┘
                                         │
                                         ▼
                                ┌────────────────┐
                                │ Cloudflare D1  │
                                │ WhatsApp API   │
                                │ Email API      │
                                └────────────────┘
```

Implementación del MCP server con `@modelcontextprotocol/sdk`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new Server({ name: 'helora-mcp', version: '1.0.0' })

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_new_requests',
      description: 'Lista solicitudes de contacto con status=nuevo',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'assign_engineer',
      description: 'Asigna manualmente un ingeniero a una solicitud',
      inputSchema: {
        type: 'object',
        properties: {
          requestId: { type: 'string' },
          engineerId: { type: 'string' }
        },
        required: ['requestId', 'engineerId']
      }
    }
  ]
}))

// Implementar handlers...
```

---

## 7. Pasos recomendados para implementación

### Fase 1 — Despliegue (1-2 días)
- [ ] Configurar variables en `.env.local` (ver `.env.example`)
- [ ] Crear cuenta de Brevo y verificar Gmail remitente
- [ ] Probar el flujo completo de contacto
- [ ] Comprar dominio `helora.cu` (o `.com` si no disponible)
- [ ] Conectar repo a Cloudflare Pages
- [ ] Configurar variables de entorno
- [ ] Migrar SQLite → D1
- [ ] Verificar que el formulario funciona en producción

### Fase 2 — Identidad de marca (1 semana)
- [ ] Diseñar logo definitivo (versión actual es placeholder)
- [ ] Fotografías profesionales de ingenieros
- [ ] Fotografías reales de trabajos (con permiso de clientes)
- [ ] Completar biografías en `ENGINEERS_PUBLIC`
- [ ] Actualizar `ENGINEERS_PRIVATE` con datos reales

### Fase 3 — WhatsApp Business (2-3 semanas)
- [ ] Crear Meta Business Account
- [ ] Verificar negocio
- [ ] Solicitar WhatsApp Business API
- [ ] Crear plantillas de mensajes aprobadas
- [ ] Desplegar Worker de automatización
- [ ] Probar flujo end-to-end

### Fase 4 — Email transaccional (1 semana)
- [ ] Crear Resend account
- [ ] Verificar dominio
- [ ] Diseñar plantillas HTML
- [ ] Integrar con Worker

### Fase 5 — IA / Agentes (4-8 semanas)
- [ ] Definir casos de uso prioritarios
- [ ] Implementar con Cloudflare Workers AI
- [ ] O implementar MCP server para Claude/GPT externo
- [ ] Capacitar al equipo en uso

---

## 8. Mantenimiento del sitio

### Actualizar ingenieros

Editar `src/lib/site-data.ts`:

```typescript
{
  id: "ing-1",
  name: "Ing. Roberto Suárez Martínez",
  role: "Director Técnico",
  initials: "RS",
  experienceYears: 14,
  specialties: ["Sistemas fotovoltaicos", "Almacenamiento LiFePO4", "Deye", "MUST"],
  bio: "Ingeniero Electricista graduado de la CUJAE con más de 14 años de experiencia en diseño e instalación de sistemas fotovoltaicos...",
  photo: "/assets/team/ing-1.jpg"  // Subir foto a /public/assets/team/
}
```

### Actualizar portfolio

Editar `PORTFOLIO` en `src/lib/site-data.ts` y subir imagen a `/public/assets/portfolio/`.

### Actualizar marcas

Editar `BRANDS` en `src/lib/site-data.ts`.

### Actualizar servicios

Editar `SERVICES` en `src/lib/site-data.ts`.

---

## 9. Contacto y soporte

Este documento acompaña al código fuente entregado. Para futuras iteraciones:

1. **Modificar datos**: editar `src/lib/site-data.ts`
2. **Cambiar estilos**: editar `src/app/globals.css`
3. **Añadir secciones**: crear componente en `src/components/site/` y añadir a `page.tsx`
4. **Endpoints nuevos**: crear en `src/app/api/`

El proyecto está listo para iteración. Cada sección fue construida para ser modificable sin tocar la arquitectura subyacente.
