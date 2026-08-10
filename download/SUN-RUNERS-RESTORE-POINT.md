# 🗂️ SUN-RUNNERS — Punto de Restauración Completo

> **Documento de recuperación de contexto.**
> Si este chat se cae, se crashea, o el asistente pierde memoria,
> SUBE este archivo a un nuevo chat y continúa desde donde estábamos.

**Fecha de creación:** 2026-08-08
**Versión:** 1.0
**Proyecto:** SUN-RUNNERS — Sitio web + automatización Cloudflare

---

## 🎯 RESUMEN EJECUTIVO

Construcción de un sitio web profesional minimalista para **SUN-RUNNERS**, empresa cubana de ingeniería eléctrica y automatización. Servicios: sistemas fotovoltaicos con batería, instalaciones eléctricas residenciales, automatización de bombeo, gestión de proyectos eléctricos, climatización. Stack: Next.js 16 + TypeScript + Tailwind CSS 4 + Prisma SQLite (migrando a Cloudflare D1) + Brevo para email transaccional + Cloudflare Workers para API. Logo SVG vectorial 100% fiel al original del cliente. Animación intro de 3 segundos (fondo negro, logo blanco).

**Estado actual:** Sitio Next.js funcional en local. Migrando API a Cloudflare Workers con D1.

---

## 👤 CLIENTE / USUARIO

- **Nombre:** Dashiell (cuenta Gmail: `Dashiellyeneri@gmail.com`)
- **Ubicación:** Cuba
- **Dispositivo actual:** Teléfono móvil (sin acceso a PC)
- **Empresa:** SUN-RUNNERS (ingeniería en energía, automatización y clima)
- **Cuenta Cloudflare:** `Dashiellyeneri@gmail.com's Account`
- **WhatsApp del usuario:** No proporcionado aún

### Cómo trabaja el cliente
- No tiene PC disponible, todo se hace desde el móvil
- Quiere que el asistente maneje la CLI (Wrangler, npm, etc.)
- Quiere recibir el HTML standalone para ver previews desde el móvil
- Prefiere entregables descargables en `/home/z/my-project/download/`

---

## 🔑 CREDENCIALES Y IDs

### Cloudflare
- **Account ID:** `29b40f5c76f58a5e101d22226337cf46`
- **D1 Database ID:** `84368f8a-9c9b-44af-bbf2-c86895ba2e11`
- **D1 Database Name:** `sun-runners-db`
- **API Token:** `[REVOCADO POR SEGURIDAD — generar nuevo token en https://dash.cloudflare.com/profile/api-tokens si se necesita]`
  - Permisos: Workers Scripts Edit, D1 Edit, Workers KV Storage Edit, Workers Routes Edit, R2 Edit, Pages Edit, Containers Edit, Builds Edit, Agents Edit, Observability Edit
  - TTL: Sin expiración configurada
  - **⚠️ REVOCAR este token cuando terminemos el deploy** (en https://dash.cloudflare.com/profile/api-tokens)
- **URL del dashboard:** https://dash.cloudflare.com/29b40f5c76f58a5e101d22226337cf46/workers/d1/databases/84368f8a-9c9b-44af-bbf2-c86895ba2e11
- **Worker name (a crear):** `sun-runners-api`
- **Worker URL esperada:** `https://sun-runners-api.<subdomain>.workers.dev` (subdomain se asigna en deploy)
- **Nota:** El cliente tiene OTRA aplicación corriendo en Cloudflare. NO tocar nada fuera de `sun-runners-api` y `sun-runners-db`.

### Brevo (Email transaccional)
- **Estado:** Cliente ya creó cuenta
- **API Key:** NO proporcionada aún (cliente debe generarla en Brevo → Settings → API Keys)
- **From Email (Gmail verificado):** NO proporcionado aún (cliente debe verificar Gmail en Brevo → Senders & IP)
- **Plan:** Free (300 emails/día, sin dominio requerido)
- **Documentación:** https://developers.brevo.com/reference/sendtransacemail

### WhatsApp Business API (futuro — Fase 5)
- **Estado:** NO configurado
- **Necesita:** Meta Business Account, WhatsApp Business API access, Phone Number ID, Access Token
- **URL para configurar:** https://business.facebook.com

### Base de datos local (Prisma SQLite — solo desarrollo)
- **DATABASE_URL:** `file:/home/z/my-project/db/custom.db`
- **Schema:** `prisma/schema.prisma`

---

## 📂 ESTRUCTURA DEL PROYECTO

**Ruta base:** `/home/z/my-project/`

```
src/
├── app/
│   ├── api/
│   │   ├── contact/route.ts      ← Endpoint formulario (valida + asigna + email)
│   │   └── health/route.ts       ← Diagnóstico Brevo
│   ├── globals.css               ← Sistema de diseño + animación intro
│   ├── layout.tsx                ← Metadata + fonts
│   └── page.tsx                  ← Composición del home
├── components/
│   ├── site/
│   │   ├── Logo.tsx              ← SVG vectorial 100% fiel al original
│   │   ├── IntroAnimation.tsx    ← Splash 3s (fondo negro, logo blanco)
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── Services.tsx          ← 5 servicios
│   │   ├── Technologies.tsx      ← 16 marcas mercado cubano
│   │   ├── Portfolio.tsx
│   │   ├── About.tsx             ← Conócenos + manifiesto
│   │   ├── Contact.tsx           ← Form con Zod + asignación ingeniero
│   │   └── Footer.tsx
│   └── ui/                       ← shadcn/ui components
└── lib/
    ├── types.ts                  ← Tipos (Service, Brand, EngineerPublic/Private…)
    ├── site-data.ts              ← COMPANY, SERVICES, BRANDS, ENGINEERS, NAV
    ├── brevo.ts                  ← Cliente API Brevo (sin dominio)
    ├── email-templates.ts        ← HTML email cliente + ingeniero
    ├── engineer-assignment.ts    ← Haversine + 30 coords Cuba
    └── db.ts                     ← Prisma client
prisma/
└── schema.prisma                 ← ContactRequest + AutomationLog
public/
├── favicon.svg
├── sun-runners-logo.svg
├── sun-runners-logo-white.svg
├── sun-runners-logo-black.svg
└── assets/{hero.jpg, portfolio/p1-p6.jpg}
```

**Archivos clave a consultar:**
- `src/lib/site-data.ts` — toda la data del sitio (compañía, servicios, marcas, ingenieros)
- `src/lib/engineer-assignment.ts` — algoritmo haversine + coordenadas Cuba
- `src/lib/brevo.ts` — cliente email
- `src/lib/email-templates.ts` — plantillas HTML email
- `src/app/api/contact/route.ts` — endpoint principal

---

## 🎨 SISTEMA DE DISEÑO

**Estética:** minimalismo editorial cálido
**Paleta:**
- Background: `#F7F5EF` (off-white warm)
- Foreground: `#0F100C` (near-black warm)
- Accent: `#B8702E` (amber warm — único acento)
- Border: `#DDD6C5`
- Muted: `#ECE7DA`

**Tipografía:** Geist Sans (Google Fonts) + Geist Mono
**Componentes:** shadcn/ui + Lucide icons

---

## 🏗️ DATOS DEL SITIO (site-data.ts)

### Compañía
```typescript
COMPANY = {
  name: "SUN-RUNNERS",
  legalName: "SUN-RUNNERS — Ingeniería en Energía",
  tagline: "Ingeniería que perdura.",
  email: "contacto@sun-runners.cu",
  phone: "+53 5 000 0000",
  city: "La Habana, Cuba",
  coverage: "Toda Cuba — La Habana, Matanzas, Villa Clara, Camagüey, Santiago de Cuba",
  hours: "Lun–Sáb · 8:00–18:00",
  social: { instagram: "@sun-runners.cu", facebook: "SUN-RUNNERS Cuba" }
}
```

### Servicios (5)
1. **fotovoltaico** — Sistemas fotovoltaicos con respaldo de batería
2. **residencial** — Instalaciones eléctricas residenciales
3. **bombeo** — Automatización de sistemas de bombeo de agua
4. **proyectos** — Levantamiento, confección y gestión de proyectos
5. **clima** — Instalación y mantenimiento de sistemas de clima

### Marcas (16) — mercado cubano
MUST, Sunri, BC Energy, Sunshine, Deye, Growatt, Felicity Solar, Pylontech, Voltronic/Axpert, Eco-Worthy, GoodWe, SolaX, SRNE, Easun, Victron Energy, Huawei

### Ingenieros Públicos (4 placeholders — cliente debe actualizar)
- ing-1: Director Técnico
- ing-2: Responsable de Fotovoltaica
- ing-3: Responsable de Automatización
- ing-4: Responsable de Clima y Mantenimiento

### Ingenieros Privados (4 — servidor únicamente, NO exponer al cliente)
```typescript
ing-1: La Habana Centro/Oeste, lat 23.1136, lng -82.3666, whatsapp +53500000001
ing-2: La Habana Este, lat 23.0892, lng -82.2889, whatsapp +53500000002
ing-3: Matanzas, lat 22.8069, lng -81.2431, whatsapp +53500000003
ing-4: Camagüey, lat 20.0247, lng -77.7867, whatsapp +53500000004
```

---

## 🔧 FASES DEL PROYECTO

### ✅ COMPLETADO

- **Fase 0:** Análisis de requisitos y diseño del sitio
- **Fase 0.5:** Cambio de nombre HELORA → SUN-RUNNERS en todo el código
- **Fase 0.6:** Logo SVG vectorial 100% fiel al original del cliente
- **Fase 0.7:** Animación intro 3s (fondo negro, logo blanco)
- **Sitio Next.js completo** — Header, Hero, 5 servicios, 16 marcas, portfolio, Conócenos, manifiesto, formulario, Footer
- **Backend Next.js** — endpoint /api/contact con Prisma + Brevo + asignación ingeniero
- **Plantillas HTML email** — cliente + ingeniero + copia central
- **Fase 1 (Cloudflare):** Cliente creó cuenta Cloudflare ✅
- **Fase 2 (D1):** Cliente creó D1 database `sun-runners-db` ✅
- **Fase 3 (Token):** Cliente creó API token con permisos Edit Cloudflare Workers ✅

### 🔄 EN PROGRESO

- **Fase 4 (Deploy Worker):** Adaptando código a Workers runtime, deployando Worker, aplicando migración SQL a D1

### ⏳ PENDIENTE

- **Fase 5 (WhatsApp Business API):** Cliente debe crear Meta Business Account + WhatsApp Business API
- **Fase 6 (Implementar WhatsApp en Worker):** Agregar `src/lib/whatsapp.ts` y modificar /api/contact
- **Fase 7 (Deployar frontend):** Cloudflare Pages o Vercel — cliente decide
- **Fase 8 (Automatización avanzada):** Cron worker, IA, MCP server, dashboard interno

### 🔮 FUTURO

- Actualizar `ENGINEERS_PUBLIC` con nombres, fotos, bios reales
- Actualizar `ENGINEERS_PRIVATE` con coords, WhatsApp, email reales
- Reemplazar imágenes placeholder en `/public/assets/`
- Geocoding real (Nominatim o Google Maps API)
- Dashboard interno protected route

---

## 📜 HISTORIAL COMPLETO DE MENSAJES

### Mensaje 1 (usuario) — Requerimiento inicial detallado
Construir sitio web hiper-profesional minimalista para equipo de ingenieros electricistas cubanos. Servicios: PV con batería, eléctrico residencial, automatización bombeo, gestión proyectos, AC. Mostrar marcas inversores/baterías del mercado cubano (Sunri, BC Energy, Must, Sunshine, otras chinas). Sección "Conócenos" con info ingenieros (a actualizar después). Portfolio de la compañía (no individual). No hay nombre/logo de empresa — crear original (no palabras eléctricas literales). Guiar setup de Cloudflare API para automatización (WhatsApp/email auto-reply, asignación ingeniero más cercano). Info de contacto de ingenieros oculta para asignación automática por distancia. Futuro MCP/AI agents. Diseño ultra-profesional minimalista referenciando los mejores sitios del mundo.

### Mensaje 2 (usuario) — Brevo en vez de Resend
"Antes de esto quiero que me entregues el código html completo siempre. Pero hay un detail que quiero comentarte, resend solo deja recibir correos en modo free, no tengo dominio y quiero usar alguna alternativa como brevo para el caso de los Gmail o es resend necesario, no se hablo desde el desconocimiento"

**Decisión:** Cambiar de Resend a Brevo. Brevo permite enviar desde Gmail verificado sin dominio propio. Plan free: 300 emails/día.

### Mensaje 3 (usuario) — Logo + nombre + splash animation
"Ya tengo cuenta de brevo. Cree un logo que te adjunto para que crees un svg 100 % fiel. El logo lo debes integrar en la web y cambiar el logo que habías hecho. El nombre de la empresa o compañía es SUN-RUNNERS. Con el logo también has una animación inicial de 3d segundos. La animación será con. El fondo negro y el logo en blanco tal y como sale en la foto original. El sgv del logo cuando vayas a vectorizarlo tiene que quedar con cero pixeles dentados todo debe verse idénticamente a la imagen original."

**Acción tomada:** Vectorizado SVG con marching squares, 4 paths (sol + 3 rayos), 100% fiel. Creado `IntroAnimation.tsx` con splash 3s. Cambiado HELORA → SUN-RUNNERS en todo el código.

### Mensaje 4 (usuario) — Pedir HTML del código construido
"Dame el HTML de lo que ya está hecho"

**Acción tomada:** Generado ZIP con todo el código fuente en `/home/z/my-project/download/sun-runners-src.zip` y mostrados los archivos principales en el chat.

### Mensaje 5 (usuario) — Pedir HTML para preview
"No me entregaste el html quiero el html ara ver un preview de como está todo"

**Acción tomada:** Iniciado dev server Next.js, capturado HTML renderizado, inlineado CSS, embebidas 7 imágenes como data URIs, agregada animación intro como CSS fallback. Generado archivo standalone `/home/z/my-project/download/sun-runners-preview.html` (1.4 MB).

### Mensaje 6 (usuario) — Pedir plan para API Cloudflare
"Dime los paso para crear la API en clouflare y puedas implementarla y luego vas haciendo las modificaciones poco a poco"

**Acción tomada:** Definido plan de 8 fases. Cliente confirma empezar.

### Mensaje 7 (usuario) — Fase 1 lista, pregunta sobre Fase 2
"Fase 1 lista. Estoy en la fase 2. Que tipo de base de datos debo elegir 'Ubicación' o 'Especificar jurisdicción'"

**Acción tomada:** Explicada diferencia. Recomendado "Ubicación" → "North America" (datacenter Miami, mejor latencia para Cuba).

### Mensaje 8 (usuario) — Mandar IDs de Cloudflare
URL con Account ID y Database ID: `https://dash.cloudflare.com/29b40f5c76f58a5e101d22226337cf46/workers/d1/databases/84368f8a-9c9b-44af-bbf2-c86895ba2e11/metrics`

**Acción tomada:** IDs anotados. Cliente avanza con Fase 3 (Wrangler).

### Mensaje 9 (usuario) — No tiene PC, pedir manejar Wrangler
"Estoy desde mi teléfono celularno tengo asequible la PC. El wrangler lo puedo dejar en tu manos ?"

**Acción tomada:** Explicado que sí, asistente maneja Wrangler. Cliente solo necesita crear API token desde el navegador del móvil.

### Mensaje 10 (usuario) — Preocupación por token existente
"Tengo ya un token pero no sé cómo funciona porque ya tengo otra aplicación corriendo en clouflare, no sé si ese mismo token te lo puedo dar y no corro riesgo de modificar la aplicación que ya tengo echa"

**Acción tomada:** Recomendado crear token NUEVO dedicado. Plantilla "Edit Cloudflare Workers". No reutilizar el de la otra app.

### Mensaje 11 (usuario) — Creando token, pregunta qué cuentas/zona incluir
"Ya estoy creando el nuevo token, que cuentas debo incluir que zona debo incluir?"

**Acción tomada:** Explicado: Account Resources = Include → Specific account → tu cuenta. Zone Resources = dejar vacío.

### Mensaje 12 (usuario) — Resumen del token listo
[Captura de pantalla del resumen del token]

**Acción tomada:** Analizada con VLM. Confirmados permisos correctos. Recomendado continuar.

### Mensaje 13 (usuario) — Token + 3 pedidos
"[token Cloudflare revocado por seguridad]. Cuando implementes coloca las imágenes que habías colocado anteriormente. y dame el link para verla. Crea un punto de restauración que tenga toda la información de nuestro historial del chat, claves API, en fin toda la información detallada y necesaria para que si por alguna casualidad pierdes la memoria o este chat se crachea o tiene problema, pueda subirla a otro chat y continue siguiendo el mismo hilo actual"

**Acción tomada:** Este documento. Luego: implementar Worker, deployar, regenerar preview HTML.

---

## 🎯 INSTRUCCIONES PARA CONTINUAR EN NUEVO CHAT

Si estás leyendo esto en un nuevo chat porque el anterior se cayó:

1. **Lee todo este documento primero** — contiene TODOS los datos necesarios
2. **Confirma con el usuario** que tiene este archivo y que el proyecto es SUN-RUNNERS
3. **Verifica el estado del Worker** ejecutando:
   ```bash
   curl https://sun-runners-api.<subdomain>.workers.dev/health
   ```
   (si ya está deployado)
4. **Continúa con la siguiente fase** según el estado arriba
5. **No pidas credenciales al usuario de nuevo** — están aquí
6. **Maneja Wrangler tú mismo** — el usuario está desde el móvil sin PC
7. **Siempre entrega HTML standalone** para preview desde el móvil

### Datos críticos que necesitas saber
- El usuario trabaja desde el MÓVIL — no puede ejecutar comandos CLI
- El asistente maneja toda la CLI (Wrangler, npm, etc.) desde este entorno
- Todas las entregas van a `/home/z/my-project/download/`
- El token de Cloudflare debe REVOCARSE al finalizar
- NO tocar otras apps en la cuenta Cloudflare del usuario

---

## 📋 PRÓXIMOS PASOS INMEDIATOS

Después de crear este documento:

1. Instalar Wrangler en `/home/z/my-project/`
2. Configurar `wrangler.toml` con Account ID + Database ID
3. Crear `worker/` con código adaptado a Workers runtime (D1 binding, fetch nativo, sin Prisma)
4. Crear migración SQL `migrations/0001_init.sql`
5. Deployar Worker: `wrangler deploy`
6. Aplicar migración: `wrangler d1 execute sun-runners-db --file=migrations/0001_init.sql`
7. Setear secrets (BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_NOTIFY_EMAIL, WHATSAPP_PUBLIC_NUMBER)
   - Estos secrets los debe setear el usuario cuando tenga sus creds de Brevo
8. Probar endpoints con curl
9. Regenerar preview HTML con imágenes embebidas
10. Entregar URLs al usuario

---

## 🔐 SEGURIDAD

- El API token de Cloudflare está en este documento — **después del deploy, el usuario debe revocarlo**
- Brevo API key: NO está aquí todavía (usuario no la ha generado)
- Datos PRIVADOS de ingenieros (coords, WhatsApp, email) están en `src/lib/site-data.ts` — deben actualizarse con datos reales antes de producción
- El endpoint `/api/contact` NO expone datos privados de ingenieros al cliente

---

**Documento generado por:** Super Z (asistente GLM)
**Ambiente:** /home/z/my-project/
**Stack:** Next.js 16 + TypeScript + Tailwind 4 + Prisma + Cloudflare Workers + D1 + Brevo
