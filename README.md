# SUN-RUNERS

> Sitio web + automatización Cloudflare para SUN-RUNERS, empresa cubana de ingeniería eléctrica y automatización.

**URL pública:** https://sun-runers.pages.dev
**Última actualización:** 2026-08-10

---

## 📋 Tabla de contenidos

- [Resumen](#resumen)
- [Cliente](#cliente)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Cómo correr localmente](#cómo-correr-localmente)
- [Cómo hacer deploy](#cómo-hacer-deploy)
- [Documentos importantes](#documentos-importantes)
- [Historial de cambios](#historial-de-cambios)
- [Recuperación de contexto](#recuperación-de-contexto)

---

## Resumen

SUN-RUNERS es una empresa cubana liderada por Dashiell que ofrece servicios de:
- Sistemas fotovoltaicos con batería
- Instalaciones eléctricas residenciales
- Automatización de bombeo
- Gestión de proyectos eléctricos
- Climatización

Este proyecto construye su presencia web: un sitio Next.js minimalista, profesional y optimizado para móvil (el cliente trabaja desde el teléfono). El sitio se despliega como HTML standalone estático en Cloudflare Pages, con un Worker + D1 como backend para el formulario de contacto y futuras automatizaciones (Brevo para email transaccional, WhatsApp Business API en roadmap).

## Cliente

- **Nombre:** Dashiell
- **Email:** Dashiellyeneri@gmail.com
- **Ubicación:** Cuba
- **Dispositivo principal:** Teléfono móvil (sin PC)
- **Cuenta Cloudflare:** Dashiellyeneri@gmail.com's Account

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 |
| UI components | shadcn/ui |
| ORM | Prisma (SQLite en dev, Cloudflare D1 en prod) |
| Backend | Cloudflare Workers (Hono) + Cloudflare Pages Functions |
| Base de datos prod | Cloudflare D1 (`sun-runners-db`) |
| Email transaccional | Brevo (API) |
| Hosting estático | Cloudflare Pages (`sun-runers` project) |
| Logo | SVG vectorial custom (icono del sol + 3 rayos) |
| Paleta de marca | Off-white #F7F5EF, near-black #0F0F0F, amber accent #B8702E |

## Estructura del proyecto

```
/home/z/my-project/
├── src/                          # App Next.js (desarrollo local)
│   ├── app/                      # App Router (páginas + API routes)
│   ├── components/               # Componentes React (Header, Footer, etc.)
│   ├── lib/                      # Utilidades (brevo, prisma, etc.)
│   └── ...
├── pages-deploy/                 # HTML standalone + Cloudflare Pages Functions
│   ├── functions/api/            # API routes para Pages (contact, health)
│   ├── wrangler.toml             # Config de Pages
│   └── ...
├── worker/                       # Cloudflare Worker (Hono) — backend API
│   ├── src/
│   ├── wrangler.toml
│   └── package.json
├── prisma/                       # Schema de base de datos
│   └── schema.prisma
├── scripts/                      # Scripts de build, deploy, diagnóstico
│   ├── build-standalone-html.py # Genera el HTML standalone desde Next.js dev
│   ├── build-logo-svg.py        # Construye el logo SVG
│   ├── generate-project-record.js # Genera el DOCX de registro del proyecto
│   ├── sync-to-github.sh        # Sincroniza el repo con GitHub
│   └── ...
├── download/                     # Entregables descargables (DOCX, MD, HTML, ZIP)
│   ├── SUN-RUNERS-REGISTRO-COMPLETO.docx
│   ├── SUN-RUNERS-RESTORE-POINT.md
│   └── ...
├── public/                       # Assets estáticos (logo, favicon, imágenes)
├── worklog.md                    # Log multi-agente compartido (TODO el historial)
├── .env.example                  # Plantilla de variables de entorno
└── README.md                     # Este archivo
```

## Cómo correr localmente

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con valores reales (tokens, API keys, etc.)

# 3. Inicializar base de datos SQLite local
npx prisma db push

# 4. Levantar dev server
npm run dev
# → http://localhost:3000
```

## Cómo hacer deploy

El sitio se despliega como **HTML standalone estático** (no SSR) para que funcione sin dependencias en Cloudflare Pages. El flujo es:

```bash
# 1. Generar HTML standalone desde Next.js dev server
python3 scripts/build-standalone-html.py

# 2. Deploy a Cloudflare Pages
cd pages-deploy && npx wrangler pages deploy . --project-name=sun-runers
```

URL pública resultante: https://sun-runers.pages.dev

## Documentos importantes

| Documento | Ubicación | Descripción |
|-----------|-----------|-------------|
| Registro completo del proyecto | `download/SUN-RUNERS-REGISTRO-COMPLETO.docx` | Documento Word con todos los detalles técnicos, cronología de tareas, estado actual y pendientes |
| Punto de restauración | `download/SUN-RUNERS-RESTORE-POINT.md` | Markdown para subir a un nuevo chat y recuperar contexto completo |
| Worklog multi-agente | `worklog.md` | Log detallado de todas las tareas ejecutadas (Tasks 1-19) |
| Esta guía | `README.md` | Visión general del proyecto |

## Historial de cambios

El historial completo está en `worklog.md`. Resumen de hitos:

- **Task 2:** Investigación de marcas de inversores y baterías usadas en Cuba (30+ marcas catalogadas)
- **Tasks 1, 3-9:** Diseño y construcción del sitio Next.js (paleta, tipografía, componentes, animación intro)
- **Task 10:** Generación del logo SVG vectorial
- **Task 11:** HTML standalone para Cloudflare Pages
- **Tasks 12-14:** Worker + D1 + schema de base de datos
- **Task 15:** Fix del header (fondo sólido al hacer scroll)
- **Task 16:** Corrección del nombre de marca (SUN-RUNERS, una sola N) + wordmark en header
- **Task 17:** Fix del footer (wordmark de texto legible)
- **Task 18:** Fix del menú hamburguesa móvil
- **Task 19:** Generación del documento de registro completo

## Recuperación de contexto

Si este chat se cae, se crashea, o el asistente pierde memoria:

1. **Opción A — GitHub (recomendado):** Clonar este repo y compartir el contenido con un nuevo chat del asistente. Ver `GH-RESTORE-INSTRUCTIONS.md` para pasos detallados.
2. **Opción B — Restore point manual:** Subir el archivo `download/SUN-RUNERS-RESTORE-POINT.md` a un nuevo chat. Este archivo contiene toda la información crítica del proyecto (cliente, credenciales sin secretos, stack, historial).
3. **Opción C — Documento Word:** El archivo `download/SUN-RUNERS-REGISTRO-COMPLETO.docx` contiene el registro completo del proyecto.

⚠️ **Seguridad:** El token de Cloudflare que se usó durante el desarrollo ya fue **revocado** en los archivos de este repo. Si necesitas un token nuevo, generarlo en https://dash.cloudflare.com/profile/api-tokens y guardarlo en `.env` (nunca commitear el `.env` real).

---

**Contacto del proyecto:** Dashiellyeneri@gmail.com
