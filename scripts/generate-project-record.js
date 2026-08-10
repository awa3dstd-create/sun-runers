/**
 * SUN-RUNERS — Documento de Registro Completo del Proyecto
 *
 * Genera un documento Word (.docx) con TODOS los detalles de lo que se ha hecho
 * hasta ahora en el proyecto, basado en el worklog.md (Tasks 1-18).
 *
 * Estructura:
 *  1. Portada
 *  2. Resumen Ejecutivo
 *  3. Información del Cliente y Cuenta
 *  4. Stack Tecnológico
 *  5. Cronología Detallada de Tareas (Task 1 → 18)
 *  6. Estado Actual del Proyecto
 *  7. Pendientes y Próximos Pasos
 *  8. Apéndice: Estructura de Archivos
 */

const {
  Document, Packer, Paragraph, TextRun, Header, Footer, PageBreak,
  AlignmentType, HeadingLevel, PageNumber, NumberFormat,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  TableOfContents, Tab, LevelFormat, convertInchesToTwip,
  PageOrientation, VerticalAlign, HeightRule, SectionType,
} = require("docx");
const fs = require("fs");

// ─── Paleta: Plain Paper (Neutral + Medium + Calm) — apto para reportes técnicos ───
const P = {
  primary: "#0F100C",   // near-black (brand foreground)
  body: "#1A1B17",      // near-black warm
  secondary: "#5A5B57", // mid gray
  accent: "#B8702E",    // amber (brand accent)
  surface: "#F7F5EF",   // off-white (brand background)
  light: "#E8E5DC",     // surface darker
};
const c = (hex) => hex.replace("#", "");

// ─── Helpers ───
function safeText(value, placeholder = "—") {
  if (value === undefined || value === null || value === "" ||
      String(value) === "NaN" || String(value) === "undefined") {
    return placeholder;
  }
  return String(value);
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    children: [new TextRun({
      text: safeText(text), bold: true, size: 32, color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "SimHei" },
    })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({
      text: safeText(text), bold: true, size: 28, color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "SimHei" },
    })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({
      text: safeText(text), bold: true, size: 24, color: c(P.primary),
      font: { ascii: "Calibri", eastAsia: "SimHei" },
    })],
  });
}

function body(text, opts = {}) {
  const runs = Array.isArray(text) ? text : [{ text }];
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, before: 0, after: 120 },
    children: runs.map(r => new TextRun({
      text: safeText(r.text),
      bold: r.bold || false,
      italics: r.italics || false,
      size: 22,
      color: c(P.body),
      font: { ascii: "Calibri", eastAsia: "SimSun" },
    })),
    ...opts,
  });
}

function bullet(text, level = 0) {
  const runs = Array.isArray(text) ? text : [{ text }];
  return new Paragraph({
    spacing: { line: 312, before: 0, after: 80 },
    indent: { left: 720 + (level * 360), hanging: 360 },
    children: [
      new TextRun({
        text: "• ",
        size: 22,
        color: c(P.accent),
        font: { ascii: "Calibri" },
      }),
      ...runs.map(r => new TextRun({
        text: safeText(r.text),
        bold: r.bold || false,
        size: 22,
        color: c(P.body),
        font: { ascii: "Calibri", eastAsia: "SimSun" },
      })),
    ],
  });
}

function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 200 },
    children: [new TextRun({
      text: safeText(text),
      italics: true,
      size: 20,
      color: c(P.secondary),
      font: { ascii: "Calibri", eastAsia: "SimSun" },
    })],
  });
}

function spacer(after = 200) {
  return new Paragraph({
    spacing: { before: 0, after },
    children: [new TextRun({ text: "" })],
  });
}

// ─── Tabla simple ───
function makeTable(headers, rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map(h => new TableCell({
      width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      shading: { type: ShadingType.CLEAR, fill: c(P.primary), color: "auto" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          text: safeText(h), bold: true, size: 20, color: "FFFFFF",
          font: { ascii: "Calibri", eastAsia: "SimHei" },
        })],
      })],
    })),
  });

  const dataRows = rows.map((row, i) => new TableRow({
    cantSplit: true,
    children: row.map(cell => new TableCell({
      width: { size: Math.floor(100 / row.length), type: WidthType.PERCENTAGE },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      shading: i % 2 === 0
        ? { type: ShadingType.CLEAR, fill: c(P.surface), color: "auto" }
        : { type: ShadingType.CLEAR, fill: "FFFFFF", color: "auto" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          text: safeText(cell), size: 20, color: c(P.body),
          font: { ascii: "Calibri", eastAsia: "SimSun" },
        })],
      })],
    })),
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: c(P.secondary) },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: c(P.secondary) },
      left: { style: BorderStyle.SINGLE, size: 4, color: c(P.secondary) },
      right: { style: BorderStyle.SINGLE, size: 4, color: c(P.secondary) },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: c(P.light) },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: c(P.light) },
    },
  });
}

// ─── Cover ───
function buildCover() {
  return [
    // Top spacer
    spacer(2400),
    // Brand mark line
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [new TextRun({
        text: "SUN-RUNERS",
        bold: true,
        size: 56,
        color: c(P.primary),
        font: { ascii: "Calibri" },
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 600 },
      children: [new TextRun({
        text: "—  Ingeniería en Energía  —",
        size: 24,
        color: c(P.accent),
        font: { ascii: "Calibri" },
      })],
    }),
    // Main title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [new TextRun({
        text: "Documento de Registro",
        bold: true,
        size: 44,
        color: c(P.primary),
        font: { ascii: "Calibri" },
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 800 },
      children: [new TextRun({
        text: "del Proyecto Completo",
        bold: true,
        size: 44,
        color: c(P.primary),
        font: { ascii: "Calibri" },
      })],
    }),
    // Subtitle
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [new TextRun({
        text: "Sitio web + API + Infraestructura Cloudflare",
        size: 26,
        italics: true,
        color: c(P.secondary),
        font: { ascii: "Calibri" },
      })],
    }),
    // Big spacer
    spacer(3000),
    // Metadata block
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 100 },
      children: [new TextRun({
        text: "Cliente: Dashiell  ·  Cuenta: Dashiellyeneri@gmail.com",
        size: 20,
        color: c(P.body),
        font: { ascii: "Calibri" },
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 100 },
      children: [new TextRun({
        text: "URL pública: https://sun-runers.pages.dev",
        size: 20,
        color: c(P.body),
        font: { ascii: "Calibri" },
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 100 },
      children: [new TextRun({
        text: "Fecha de creación: 2026-08-08  ·  Última actualización: 2026-08-09",
        size: 20,
        color: c(P.body),
        font: { ascii: "Calibri" },
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 100 },
      children: [new TextRun({
        text: "Versión del documento: 1.0  ·  Tareas completadas: 18",
        size: 20,
        color: c(P.body),
        font: { ascii: "Calibri" },
      })],
    }),
  ];
}

// ─── Body content ───
function buildBody() {
  const content = [];

  // ═══════════════════════════════════════════════════════
  // 1. RESUMEN EJECUTIVO
  // ═══════════════════════════════════════════════════════
  content.push(h1("1. Resumen Ejecutivo"));

  content.push(body([
    { text: "SUN-RUNERS", bold: true },
    { text: " es una empresa cubana de ingeniería en energía, automatización y clima, fundada por Dashiell (Dashiellyeneri@gmail.com). El presente documento registra de manera exhaustiva todo el trabajo realizado hasta la fecha en la construcción y despliegue del sitio web institucional, la API de backend y la infraestructura en Cloudflare." },
  ]));

  content.push(body(
    "El proyecto comenzó con la investigación de marcas de inversores y baterías disponibles en el mercado cubano (30 marcas de inversores y 19 de baterías identificadas), seguida de la construcción del sitio web con Next.js 16, la vectorización 100% fiel del logo del cliente, la integración de email transaccional con Brevo, y el despliegue completo en Cloudflare Pages con base de datos D1."
  ));

  content.push(body(
    "El sitio está actualmente en producción en https://sun-runers.pages.dev con todas las funcionalidades operativas: navegación responsive desktop y móvil, formulario de contacto con asignación automática de ingeniero por proximidad geográfica (algoritmo haversine), animación de intro de 3 segundos, logo vectorial con wordmark de texto en header y footer, y menú móvil funcional. Quedan pendientes la configuración de secrets de Brevo para activar el envío real de emails, la carga de fotos reales de ingenieros y trabajos, y la vinculación del dominio personalizado sun-runers.cu cuando el cliente lo adquiera."
  ));

  content.push(spacer(200));

  // ═══════════════════════════════════════════════════════
  // 2. INFORMACIÓN DEL CLIENTE Y CUENTA
  // ═══════════════════════════════════════════════════════
  content.push(h1("2. Información del Cliente y Cuenta"));

  content.push(h2("2.1 Cliente"));
  content.push(makeTable(
    ["Campo", "Valor"],
    [
      ["Nombre", "Dashiell"],
      ["Email", "Dashiellyeneri@gmail.com"],
      ["Ubicación", "Cuba"],
      ["Dispositivo principal", "Teléfono móvil (sin acceso a PC)"],
      ["Empresa", "SUN-RUNERS (ingeniería en energía, automatización y clima)"],
      ["WhatsApp", "No proporcionado aún"],
    ]
  ));
  content.push(spacer(200));

  content.push(h2("2.2 Cuenta Cloudflare"));
  content.push(makeTable(
    ["Campo", "Valor"],
    [
      ["Account ID", "29b40f5c76f58a5e101d22226337cf46"],
      ["Subdominio de cuenta", "dashiellyeneri (no se puede cambiar; afectaría otra app del usuario)"],
      ["D1 Database ID", "84368f8a-9c9b-44af-bbf2-c86895ba2e11"],
      ["D1 Database Name", "sun-runers-db (nombre histórico, se mantiene para preservar datos)"],
      ["API Token", "[REVOCADO — ver .env o dashboard de Cloudflare]"],
      ["Token TTL", "Sin expiración configurada"],
      ["Token permisos", "Workers Scripts Edit, D1 Edit, Workers KV Storage Edit, Workers Routes Edit, R2 Edit, Pages Edit, Containers Edit, Builds Edit, Agents Edit, Observability Edit"],
      ["Dashboard URL", "https://dash.cloudflare.com/29b40f5c76f58a5e101d22226337cf46"],
    ]
  ));
  content.push(spacer(200));
  content.push(body([
    { text: "⚠️ IMPORTANTE: ", bold: true },
    { text: "El API Token de Cloudflare debe ser revocado cuando el proyecto se considere finalizado. Para revocarlo, ir a https://dash.cloudflare.com/profile/api-tokens y eliminar el token." },
  ]));

  content.push(spacer(200));

  // ═══════════════════════════════════════════════════════
  // 3. STACK TECNOLÓGICO
  // ═══════════════════════════════════════════════════════
  content.push(h1("3. Stack Tecnológico"));

  content.push(h2("3.1 Frontend"));
  content.push(makeTable(
    ["Tecnología", "Versión / Detalle"],
    [
      ["Framework", "Next.js 16.1.3 (App Router)"],
      ["Lenguaje", "TypeScript"],
      ["Estilos", "Tailwind CSS 4"],
      ["Componentes UI", "shadcn/ui"],
      ["Iconos", "lucide-react"],
      ["Fuentes", "Geist (Google Fonts) vía next/font"],
      ["Animaciones", "CSS keyframes + Transiciones Tailwind"],
    ]
  ));
  content.push(spacer(200));

  content.push(h2("3.2 Backend"));
  content.push(makeTable(
    ["Tecnología", "Versión / Detalle"],
    [
      ["Runtime", "Cloudflare Pages Functions (Worker runtime)"],
      ["Lenguaje", "TypeScript"],
      ["Base de datos", "Cloudflare D1 (SQLite)"],
      ["ORM (local)", "Prisma (SQLite para desarrollo)"],
      ["Email transaccional", "Brevo API v3 (pendiente configurar API key)"],
      ["Validación", "Native TypeScript + custom validation"],
    ]
  ));
  content.push(spacer(200));

  content.push(h2("3.3 Infraestructura y Deploy"));
  content.push(makeTable(
    ["Componente", "Detalle"],
    [
      ["Hosting", "Cloudflare Pages (proyecto: sun-runers)"],
      ["URL pública", "https://sun-runers.pages.dev"],
      ["URL preview", "https://<hash>.sun-runers.pages.dev (cambia en cada deploy)"],
      ["HTML standalone", "1.35 MB (CSS inlineado + imágenes embebidas como data URIs)"],
      ["Build script", "/home/z/my-project/scripts/build-standalone-html.py"],
      ["Deploy CLI", "wrangler 4.120.0"],
      ["Migraciones DB", "0001_init.sql (tablas: contact_request, automation_log)"],
    ]
  ));
  content.push(spacer(200));

  content.push(h2("3.4 Identidad de Marca"));
  content.push(makeTable(
    ["Elemento", "Detalle"],
    [
      ["Nombre", "SUN-RUNERS (una sola N en RUNERS)"],
      ["Significado", "Sol + corredores → energía en movimiento"],
      ["Logo", "SVG vectorial 100% fiel al PNG original del cliente (14 paths: 4 icono + 10 wordmark)"],
      ["Paleta primaria", "Off-white #F7F5EF (background)"],
      ["Paleta foreground", "Near-black #0F100C"],
      ["Color accent", "Amber #B8702E (usado en el guion del wordmark)"],
      ["Favicon", "Icono del sol + 3 rayos en blanco sobre negro"],
      ["Animación intro", "3 segundos: fondo negro + logo blanco centrado"],
    ]
  ));

  content.push(spacer(200));

  // ═══════════════════════════════════════════════════════
  // 4. CRONOLOGÍA DETALLADA DE TAREAS
  // ═══════════════════════════════════════════════════════
  content.push(h1("4. Cronología Detallada de Tareas"));

  content.push(body(
    "A continuación se detalla cada una de las 18 tareas completadas, en orden cronológico, con el trabajo realizado, las decisiones tomadas y los resultados obtenidos en cada una."
  ));
  content.push(spacer(200));

  // ─── Task 2: Investigación de marcas ───
  content.push(h2("Tarea 2 — Investigación de marcas de inversores y baterías en Cuba"));
  content.push(body([
    { text: "Agente: ", bold: true }, { text: "general-purpose (research)" },
  ]));
  content.push(body([
    { text: "Objetivo: ", bold: true },
    { text: "Identificar todas las marcas de inversores y baterías disponibles en el mercado cubano para alimentar la sección de Tecnologías del sitio." },
  ]));
  content.push(h3("Trabajo realizado"));
  content.push(bullet("Ejecutadas 19 búsquedas web (10 iniciales + 9 adicionales) con z-ai web_search, reejecutadas secuencialmente tras rate-limiting (HTTP 429)."));
  content.push(bullet("Consultas cubrieron: marcas generales, baterías litio, Sunri, BC Energy, Must, Sunshine, marcas chinas, Growatt/Deye/Voltronic, sistemas fotovoltaicos Cuba, Pylontech, Felicity Solar, Eco-Worthy/Sunboost, Voltronic/EASUN/MUST fabricantes, Sumry/SRNE/Axpert/MPP Solar, y BC Suministros."));
  content.push(bullet("Sintetizada información en catálogo estructurado de 30 marcas de inversores y 19 marcas de baterías con origen, líneas/modelos, descripción y notas para Cuba."));
  content.push(bullet("Identificadas marcas mencionadas por el cliente: Sunri (inversor 4KW ~$1180), BC Energy (=BC Suministros, MIPYME cubana que vende kits Sumry+MUST), Must (marca #1 en Cuba), Sunshine (5-10KW 48V, ~$1850 10KW)."));
  content.push(bullet("Recopilado contexto del mercado: apagones frecuentes, 110/220VAC, sistemas 12/24/48V, química LiFePO4, kits 1.5KW ($1200) a 12KW ($2800+), distribución china 1800% (USD 117M en 2025), primer banco baterías 50MW en El Cotorro (jul 2026)."));
  content.push(h3("Resultado"));
  content.push(bullet("30 marcas de inversores identificadas, dominadas por marcas chinas (MUST, Felicity, Deye, Growatt, Sunshine, Sunri, Eco-Worthy, Sumry, SRNE, Easun, PowMr, Powland, Lvyuan, PowerSmart, JMD, Solax, Solis, SAJ, Sunchees, Xindun, Marsriva) con Voltronic como fabricante ODM base, y marcas premium europeas (Victron, Fronius, Ingeteam, Azzurro) y Huawei como alternativas high-end."));
  content.push(bullet("19 marcas de baterías identificadas, con Pylontech y BYD como referencias LiFePO4 modulares 48V."));
  content.push(bullet("Top 12 marcas para destacar en el sitio: MUST, Felicity Solar, Deye, Growatt, Pylontech, Voltronic/Axpert, Sunshine, Sunri, Eco-Worthy, Easun/SRNE/Sumry, BC Suministros, GoodWe/SolaX/SAJ."));
  content.push(bullet("Documento entregado: /home/z/my-project/scripts/brands_research.md"));
  content.push(spacer(200));

  // ─── Task 1, 3-9: Construcción del sitio ───
  content.push(h2("Tarea 1, 3-9 — Construcción del sitio web completo"));
  content.push(body([
    { text: "Agente: ", bold: true }, { text: "main (Super Z)" },
  ]));
  content.push(body([
    { text: "Objetivo: ", bold: true },
    { text: "Construir el sitio web completo con branding, datos de ingenieros, portfolio, marcas y guía de automatización Cloudflare." },
  ]));
  content.push(h3("Trabajo realizado"));
  content.push(bullet("Inicializado proyecto Next.js 16 con fullstack-dev skill."));
  content.push(bullet("Lanzado agente de investigación (Task ID 2) que identificó 30 marcas de inversores y 19 de baterías en Cuba."));
  content.push(bullet("Generadas 7 imágenes (hero + 6 portfolio) con z-ai image generation."));
  content.push(bullet("Creada identidad de marca: nombre HELORA (Helios + ora) — posteriormente renombrado a SUN-RUNERS."));
  content.push(bullet("Configurada paleta warm-minimalista (off-white #F7F5EF, near-black #0F100C, accent amber #B8702E)."));
  content.push(bullet("Implementadas 6 secciones: Hero, Servicios, Tecnologías, Portfolio, Conócenos, Contacto."));
  content.push(bullet("Implementado algoritmo haversine de asignación por proximidad con 30+ provincias/municipios cubanos."));
  content.push(bullet("Creado endpoint /api/contact con Prisma (ContactRequest + AutomationLog)."));
  content.push(bullet("Verificado con Agent Browser: layout desktop y mobile, envío de formulario exitoso, DB registra asignación correcta."));
  content.push(bullet("Creada guía completa de implementación Cloudflare (despliegue, Workers, WhatsApp Business API, email, MCP)."));
  content.push(h3("Resultado"));
  content.push(bullet("Sitio ultra-pro minimalista funcional en / (single-page con secciones ancladas)."));
  content.push(bullet("16 marcas cubanas documentadas en la sección Tecnologías."));
  content.push(bullet("Estructura lista para que el usuario actualice ingenieros (datos públicos + privados separados)."));
  content.push(bullet("API de contacto operativa con asignación automática de ingeniero por proximidad."));
  content.push(bullet("Guía de implementación Cloudflare entregada en /home/z/my-project/download/HELORA-GUIA-IMPLEMENTACION.md."));
  content.push(spacer(200));

  // ─── Task 10: Brevo ───
  content.push(h2("Tarea 10 — Integración de Brevo para email transaccional"));
  content.push(body([
    { text: "Objetivo: ", bold: true },
    { text: "Integrar Brevo para email transaccional sin dominio propio (admite Gmail verificado) y mostrar código completo." },
  ]));
  content.push(h3("Trabajo realizado"));
  content.push(bullet("Creado src/lib/brevo.ts con función sendEmail() vía API v3 de Brevo."));
  content.push(bullet("Creado src/lib/email-templates.ts con dos plantillas HTML: buildClientConfirmationEmail (cliente cálido, con CTA WhatsApp) y buildEngineerNotificationEmail (interna al ingeniero, con todos los datos)."));
  content.push(bullet("Actualizado src/app/api/contact/route.ts: ahora envía 3 emails por solicitud (cliente + ingeniero asignado + copia al email central) y registra logs."));
  content.push(bullet("Creado src/app/api/health/route.ts para diagnóstico de configuración."));
  content.push(bullet("Creado .env.example con todas las variables documentadas."));
  content.push(bullet("Actualizada la guía de implementación con sección 3 Brevo completa: comparativa, setup paso a paso, flujo de emails, troubleshooting, migración futura."));
  content.push(h3("Resultado"));
  content.push(bullet("Brevo integrado y listo para usar. Usuario solo necesita pegar su BREVO_API_KEY en .env.local."));
  content.push(bullet("Plantillas HTML profesionales cálido con branding SUN-RUNERS."));
  content.push(bullet("Sistema de logs completo para auditoría y diagnóstico."));
  content.push(spacer(200));

  // ─── Task 7: Logo SVG ───
  content.push(h2("Tarea 7 — Vectorización del logo y animación de intro"));
  content.push(body([
    { text: "Objetivo: ", bold: true },
    { text: "Vectorizar el logo SUN-RUNNERS 100% fiel al PNG original, integrarlo en la web y crear animación de intro de 3 segundos." },
  ]));
  content.push(h3("Trabajo realizado"));
  content.push(bullet("Analizado el PNG original (2048×2048) con VLM (glm-5v-turbo): identificada estructura «sol + 3 rayos + wordmark SUN-RUNNERS»."));
  content.push(bullet("Escrito script /home/z/my-project/scripts/analyze-logo.py: detección de foreground, bbox, separación icono/texto, componentes conectados."));
  content.push(bullet("Escrito /home/z/my-project/scripts/extract-geometry.py: extracción precisa de geometría del sol (centro, radio, corte diagonal) y los 3 rayos (paralelogramos con esquinas)."));
  content.push(bullet("Descubierto que el «sol» no es un círculo perfecto: la parte inferior-izquierda se extiende más allá de lo que un círculo ideal predeciría (60-130 píxeles de discrepancia según la región)."));
  content.push(bullet("Enfoque final: vectorización por trazado de contornos con scikit-image (measure.find_contours) sobre imagen en escala de grises a nivel 0.5 (límite matemático exacto del anti-aliasing)."));
  content.push(bullet("Escrito /home/z/my-project/scripts/trace-v3.py: etiquetado de componentes conectados → marching squares → simplificación RDP (tolerancia 1.0 px) preservando esquinas naturales."));
  content.push(bullet("Escrito /home/z/my-project/scripts/trace-text.py: trazado independiente del wordmark «SUN-RUNNERS» (10 componentes: S-U-N-(-)-R-U-N-N-E-R-S)."));
  content.push(bullet("Construido /home/z/my-project/scripts/build-logo-svg.py: combinó icono + texto en SVG único con viewBox 0 0 1530 1106."));
  content.push(bullet("Verificación visual con VLM en 3 iteraciones: v1 (Catmull-Rom suavizado) rechazado por esquinas redondeadas; v2 (LINE segments con detección agresiva) rechazado por pocos puntos; v3 (RDP puro con tol=1.0) APROBADO con 100% fidelidad."));
  content.push(bullet("Reescrito /home/z/my-project/src/components/site/Logo.tsx: embedió los 14 paths (4 icono + 10 wordmark) inline como componentes React, con props showWordmark/variant."));
  content.push(bullet("Actualizado branding completo HELORA → SUN-RUNNERS en 11 archivos (site-data, brevo, email-templates, types, layout, globals.css, health route, Header, Hero, Footer, favicon)."));
  content.push(bullet("Creado /home/z/my-project/src/components/site/IntroAnimation.tsx: overlay fijo z-100 con fondo negro puro, logo blanco centrado, secuencia de 3s. Respeta prefers-reduced-motion y sessionStorage."));
  content.push(h3("Resultado"));
  content.push(bullet("Logo SVG 100% fiel al PNG original (verificado por VLM en 3 iteraciones)."));
  content.push(bullet("14 paths vectoriales inline en React (4 icono + 10 wordmark), sin dependencias externas."));
  content.push(bullet("Animación de intro de 3 segundos implementada: fondo negro + logo blanco, respetando prefers-reduced-motion y sessionStorage."));
  content.push(bullet("Header con contraste adaptativo (blanco sobre hero oscuro / negro sobre bg claro al hacer scroll)."));
  content.push(bullet("Build de producción Next.js 16.1.3 exitoso sin errores."));
  content.push(spacer(200));

  // ─── Task 11: Deploy Workers ───
  content.push(h2("Tarea 11 — Despliegue a Cloudflare Workers"));
  content.push(body([
    { text: "Objetivo: ", bold: true },
    { text: "Desplegar SUN-RUNNERS a Cloudflare Workers (frontend + API) y entregar URL pública." },
  ]));
  content.push(h3("Trabajo realizado"));
  content.push(bullet("Staged 25 static assets en worker/public/: index.html (1.3MB standalone), favicon.svg, 4 variantes del logo, 7 imágenes (hero + 6 portfolio), 10 archivos woff2 de fuentes Geist."));
  content.push(bullet("Actualizado wrangler.toml: añadido binding [assets] directory=\"./public\" con not_found_handling=\"single-page-application\"."));
  content.push(bullet("Actualizado worker/src/index.ts: rutas API renombradas con prefijo /api/ (/api, /api/health, /api/contact)."));
  content.push(bullet("Deploy exitoso con wrangler 4.120.0 usando CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID del restore point."));
  content.push(bullet("Aplicadas migraciones D1 (0001_init.sql) en producción remota: 2 tablas creadas (contact_request, automation_log)."));
  content.push(h3("Verificación de endpoints"));
  content.push(bullet("GET / → sirve index.html (200, content-type: text/html)"));
  content.push(bullet("GET /favicon.svg → 200 (image/svg+xml)"));
  content.push(bullet("GET /sun-runners-logo.svg → 200 (6899 bytes)"));
  content.push(bullet("GET /assets/hero.jpg → 200 (115KB)"));
  content.push(bullet("GET /media/*.woff2 → 200 (fuentes cargan correctamente)"));
  content.push(bullet("GET /api/health → 200 JSON (reports brevoConfigured: false, esperado)"));
  content.push(bullet("POST /api/contact → 200 ok:true (asignó «La Habana — Centro y Oeste» vía algoritmo haversine, persistió en D1)"));
  content.push(h3("Resultado"));
  content.push(bullet("URL pública inicial: https://sun-runners-api.dashiellyeneri.workers.dev (51 caracteres — posteriormente acortada)."));
  content.push(bullet("Frontend + API + D1 operativos en un único Worker."));
  content.push(spacer(200));

  // ─── Task 12: Acortar URL ───
  content.push(h2("Tarea 12 — Acortar la URL pública del deploy"));
  content.push(body([
    { text: "Objetivo: ", bold: true },
    { text: "Acortar la URL pública del deploy." },
  ]));
  content.push(h3("Trabajo realizado"));
  content.push(bullet("URL original: https://sun-runners-api.dashiellyeneri.workers.dev (51 caracteres)."));
  content.push(bullet("Intentado cambiar subdominio de cuenta dashiellyeneri → sunrunners vía API: error 10036 «Account already has an associated subdomain» y error 10405 «Method not allowed for this authentication scheme»."));
  content.push(bullet("El token de API no tiene permiso «Account Settings Edit» requerido. Razón adicional para NO tocarlo: el usuario tiene OTRA app corriendo en la misma cuenta, cambiar el subdominio rompería esa app."));
  content.push(bullet("Cambiado nombre del worker sun-runners-api → sr en wrangler.toml."));
  content.push(bullet("Deploy exitoso: https://sr.dashiellyeneri.workers.dev (38 chars, -13)."));
  content.push(bullet("Eliminado el worker viejo sun-runners-api vía DELETE API."));
  content.push(h3("Resultado"));
  content.push(bullet("URL pública corta: https://sr.dashiellyeneri.workers.dev (38 caracteres)."));
  content.push(bullet("Worker viejo eliminado para evitar URLs duplicadas en buscadores."));
  content.push(spacer(200));

  // ─── Task 13: Migración a Pages ───
  content.push(h2("Tarea 13 — Migración a Cloudflare Pages"));
  content.push(body([
    { text: "Objetivo: ", bold: true },
    { text: "Acortar la URL a «sun-runners» en el link (sin sr. ni dashiellyeneri)." },
  ]));
  content.push(h3("Trabajo realizado"));
  content.push(bullet("El formato Workers es fijo: <worker>.<account-subdomain>.workers.dev — imposible obtener «sun-runners.workers.dev» sin cambiar subdominio de cuenta."));
  content.push(bullet("Solución: migrar a Cloudflare Pages — formato URL es <project>.pages.dev (sin subdominio de cuenta en el medio)."));
  content.push(bullet("Verificado disponibilidad del nombre sun-runners en Pages → libre."));
  content.push(bullet("Creado proyecto Pages: wrangler pages project create sun-runners --production-branch=main."));
  content.push(bullet("Estructura migrada: pages-deploy/public/ (25 static assets) + pages-deploy/functions/api/[[path]].ts (Pages Function catch-all para /api/*) + módulos auxiliares renombrados con prefijo _ para que Pages no los trate como rutas."));
  content.push(bullet("Corregidos imports en módulos auxiliares (./site-data → ./_site-data, etc.)."));
  content.push(bullet("wrangler.toml de Pages con pages_build_output_dir=\"./public\" y binding D1 (mismo DB que el Worker anterior)."));
  content.push(bullet("Deploy exitoso: https://sun-runners.pages.dev (29 chars — 9 menos que la URL anterior de 38)."));
  content.push(bullet("Eliminado worker viejo sr vía DELETE API."));
  content.push(h3("Verificación completa"));
  content.push(bullet("GET / → 200 text/html 1.3MB"));
  content.push(bullet("GET /favicon.svg → 200 1525B"));
  content.push(bullet("GET /assets/hero.jpg → 200 115KB"));
  content.push(bullet("GET /api/health → 200 JSON"));
  content.push(bullet("POST /api/contact → 200 ok:true (asignó «La Habana — Centro y Oeste», persistió en D1)"));
  content.push(h3("Resultado"));
  content.push(bullet("URL pública final: https://sun-runners.pages.dev (29 caracteres)."));
  content.push(bullet("La otra app del usuario en Cloudflare NO fue tocada."));
  content.push(spacer(200));

  // ─── Task 14: Bug imágenes ───
  content.push(h2("Tarea 14 — Bug: imágenes no se mostraban en producción"));
  content.push(body([
    { text: "Objetivo: ", bold: true },
    { text: "Asegurar que las imágenes iniciales estén embebidas y se muestren correctamente en producción." },
  ]));
  content.push(h3("Diagnóstico"));
  content.push(bullet("Usuario reportó que faltaban imágenes en algunos apartados de la web deployada."));
  content.push(bullet("Inspeccionado HTML standalone: 9 data URIs embebidas (2 SVG + 7 JPG) — las imágenes SÍ estaban embebidas como base64."));
  content.push(bullet("Captura visual con agent-browser + VLM reveló: hero section mostraba fondo negro sólido (la imagen no se veía)."));
  content.push(bullet("Análisis del HTML: encontrado bug en build-standalone-html.py línea 80: replace_asset() devolvía f'\"{data_uri}\"' — solo la comilla + data URI, PERDIENDO el atributo src= o href=. Resultado: <img \"data:image/jpeg;base64,...\" ...> en vez de <img src=\"data:image/jpeg;base64,...\" ...>. El navegador interpretaba \"data:...\" como un atributo booleano sin nombre → la imagen no se cargaba."));
  content.push(h3("Fix"));
  content.push(bullet("Regex cambiado de (?:src|href)=\"(/assets/...)\" a (src|href)=\"(/assets/...)\" con grupo capturador para el atributo."));
  content.push(bullet("replace_asset ahora devuelve f'{attr}=\"{data_uri}\"' preservando el atributo correcto."));
  content.push(bullet("Eliminado el banner molesto «PREVIEW ESTÁTICO» del final del body."));
  content.push(bullet("Regenerado HTML standalone: 1352.6 KB con 7 imágenes embebidas correctamente."));
  content.push(h3("Verificación"));
  content.push(bullet("7 tags <img> con src=\"data:image/jpeg;base64,...\" correctos."));
  content.push(bullet("0 patrones rotos <img \"data: (missing src=)."));
  content.push(bullet("VLM confirmó: hero visible con paneles solares, 6 imágenes de portfolio cargando correctamente, ninguna rota."));
  content.push(spacer(200));

  // ─── Task 15: Contraste header ───
  content.push(h2("Tarea 15 — Arreglar contraste del header al hacer scroll"));
  content.push(body([
    { text: "Objetivo: ", bold: true },
    { text: "Arreglar contraste del header — logo y botón de menú se perdían al hacer scroll sobre ciertas secciones." },
  ]));
  content.push(h3("Diagnóstico"));
  content.push(bullet("No scrolled (scrollY ≤ 24px): bg-transparent text-background (texto blanco, transparente)."));
  content.push(bullet("Scrolled (>24px): bg-background/85 backdrop-blur-xl text-foreground (fondo off-white 85% opacidad, texto negro)."));
  content.push(bullet("Problema: el fondo translúcido al 85% dejaba pasar el color de las secciones oscuras (especialmente Tecnologías con bg-foreground #0F100C) y el logo/botones negros se confundían."));
  content.push(h3("Fix"));
  content.push(bullet("Trigger de scroll bajado de 24px → 8px (reacciona más rápido)."));
  content.push(bullet("Fondo scrolled cambiado de bg-background/85 backdrop-blur-xl → bg-background (sólido 100%)."));
  content.push(bullet("Agregado shadow-sm para definir mejor el borde inferior."));
  content.push(bullet("BUG ADICIONAL: el HTML standalone eliminó los scripts de Next.js, así que la lógica de scroll del Header no funcionaba. Solución: agregado bloque CSS + JS mínimo en build-standalone-html.py: reglas con !important que sobreescriben colores cuando header tiene clase header-scrolled, y JS que toggle la clase según window.scrollY > 8."));
  content.push(h3("Verificación visual con agent-browser + VLM en 4 posiciones de scroll"));
  content.push(bullet("Top (Hero oscuro): logo y nav blancos, excelente contraste."));
  content.push(bullet("Servicios (claro): logo y nav negros sobre fondo blanco sólido."));
  content.push(bullet("Tecnologías (oscuro): logo y nav negros sobre fondo blanco sólido del header (ANTES se perdía)."));
  content.push(bullet("Trabajos (claro): logo y nav negros sobre fondo blanco sólido."));
  content.push(spacer(200));

  // ─── Task 16: SUN-RUNERS (una N) ───
  content.push(h2("Tarea 16 — Corrección del nombre: SUN-RUNNERS → SUN-RUNERS"));
  content.push(body([
    { text: "Objetivo: ", bold: true },
    { text: "Corregir nombre de la compañía (SUN-RUNERS, una sola N) y agregar wordmark de texto en el header." },
  ]));
  content.push(h3("Diagnóstico"));
  content.push(bullet("El nombre correcto de la empresa es SUN-RUNERS (una sola N en «RUNERS»), pero el código fuente y el proyecto Pages usaban «SUN-RUNNERS» (doble N) por error de tipeo."));
  content.push(h3("Trabajo realizado"));
  content.push(bullet("Renombrado masivo con sed en 24 archivos: source code (src/, worker/src/, pages-deploy/functions/) SUN-RUNNERS → SUN-RUNERS, sun-runners → sun-runers; scripts (build-standalone-html.py, trace-text.py, build-logo-svg.py) idem."));
  content.push(bullet("Excepción preservada: «sun-runners-db» (nombre de la base de datos D1) — no se renombró para no perder los datos ya persistidos (3 solicitudes de prueba)."));
  content.push(bullet("125 referencias actualizadas en total, 0 referencias restantes al nombre incorrecto."));
  content.push(bullet("Verificado que el email de contacto, instagram, facebook, etc. ahora usan @sun-runers.cu."));
  content.push(bullet("Agregado wordmark de texto en Header.tsx: estructura <Logo showWordmark={false} /> + <span>SUN<span class=\"text-accent\">-</span>RUNERS</span> con estilo text-[15px] sm:text-base, font-semibold, tracking-[0.12em], uppercase. El guion «-» se resalta con color accent (amber #B8702E)."));
  content.push(bullet("Creado nuevo proyecto Pages «sun-runers» (una N) vía wrangler pages project create."));
  content.push(bullet("Eliminado proyecto Pages viejo «sun-runners» (doble N) vía DELETE API."));
  content.push(h3("Resultado"));
  content.push(bullet("URL pública final correcta: https://sun-runers.pages.dev (una sola N, igual que el nombre de la marca)."));
  content.push(bullet("Nombre de la marca unificado a SUN-RUNERS en TODO el código fuente (24 archivos, 125 referencias)."));
  content.push(bullet("Wordmark de texto «SUN-RUNERS» agregado al header junto al icono del logo, con el guion «-» en color accent."));
  content.push(spacer(200));

  // ─── Task 17: Footer wordmark ───
  content.push(h2("Tarea 17 — Arreglar letras del nombre en el footer"));
  content.push(body([
    { text: "Objetivo: ", bold: true },
    { text: "Arreglar las letras del nombre de la compañía en el pie de página (footer)." },
  ]));
  content.push(h3("Diagnóstico"));
  content.push(bullet("El Footer usaba <Logo variant=\"light\" /> (SVG completo con wordmark embebido)."));
  content.push(bullet("El SVG tiene viewBox=\"0 0 1530 1106\" donde el icono ocupa ~71% de la altura y el wordmark solo ~15% (las letras quedaban diminutas, ~8.6px en h-14)."));
  content.push(bullet("El Header ya tenía este problema arreglado en Task 16 usando <Logo showWordmark={false} /> + <span>SUN-RUNERS</span> separado."));
  content.push(h3("Fix"));
  content.push(bullet("Reemplazado <Logo className=\"h-12 sm:h-14\" variant=\"light\" /> por: <Logo className=\"h-12 sm:h-14 w-auto\" showWordmark={false} variant=\"light\" /> + <span className=\"text-lg sm:text-xl font-semibold tracking-[0.14em] uppercase text-background\">SUN<span className=\"text-accent\">-</span>RUNERS</span>."));
  content.push(bullet("Estructura: flex-col gap-3 (icono arriba, wordmark abajo)."));
  content.push(bullet("w-auto agregado para que el icono escale proporcionalmente al alto (no quede recortado)."));
  content.push(bullet("Wordmark más grande que en el header (text-lg/xl vs text-[15px]/base) porque el footer tiene más espacio vertical."));
  content.push(h3("Verificación visual con agent-browser + VLM"));
  content.push(bullet("«SUN-RUNERS» se ve perfectamente en texto blanco bold, mayúsculas, totalmente legible."));
  content.push(bullet("Icono del sol + 3 rayos limpio y nítido."));
  content.push(bullet("Letras completas, no cortadas, no distorsionadas, no superpuestas."));
  content.push(bullet("El guion entre SUN y RUNERS visible y centrado."));
  content.push(spacer(200));

  // ─── Task 18: Menú móvil ───
  content.push(h2("Tarea 18 — Arreglar botón de menú hamburguesa del header"));
  content.push(body([
    { text: "Objetivo: ", bold: true },
    { text: "Arreglar botón de menú hamburguesa del header que no funcionaba en móvil." },
  ]));
  content.push(h3("Diagnóstico"));
  content.push(bullet("Causa raíz: build-standalone-html.py elimina todos los scripts de Next.js (líneas 57-72) para que el HTML sea estático, pero eso rompe useState y onClick de React."));
  content.push(bullet("Problema adicional: como open empezaba en false, el SSR NO renderizaba el menú móvil en el HTML (estaba dentro de {open && (...)}), así que aunque el JS funcionara no había menú que mostrar."));
  content.push(h3("Cambios en Header.tsx"));
  content.push(bullet("Menú móvil ahora SIEMPRE en el DOM (no condicional con open &&)."));
  content.push(bullet("Visibilidad controlada por clases CSS: mobile-menu-open / mobile-menu-closed."));
  content.push(bullet("Botón toggle con clase estable mobile-menu-toggle para selección vía JS."));
  content.push(bullet("aria-label dinámico: «Abrir menú» / «Cerrar menú» según estado."));
  content.push(bullet("En React app: todo sigue funcionando igual (state toggle + class swap)."));
  content.push(h3("Cambios en build-standalone-html.py"));
  content.push(bullet("CSS nuevo: .mobile-menu-panel.mobile-menu-closed { display: none !important; } y .mobile-menu-panel.mobile-menu-open { display: block !important; }"));
  content.push(bullet("JS nuevo (3 bloques):"));
  content.push(bullet([{ text: "1) Mobile menu toggle: ", bold: true }, { text: "selecciona .mobile-menu-toggle y .mobile-menu-panel, inyecta icono X SVG (React solo renderiza Menu en SSR), funciones openMenu() / closeMenu() que alternan clases y iconos, toggle en click del botón, close al hacer clic en cualquier link/botón del panel, close al hacer clic fuera del header, close con tecla Escape." }], 1));
  content.push(bullet([{ text: "2) Smooth scroll para anclas #: ", bold: true }, { text: "selecciona todos a[href^=\"#\"], preventDefault + scrollIntoView smooth (reemplaza handleNav de React)." }], 1));
  content.push(h3("Verificación con agent-browser (viewport móvil 390x844)"));
  content.push(bullet("DOM check: toggle y panel presentes, clases correctas (mobile-menu-closed inicial)."));
  content.push(bullet("Toggle click vía JS: panel cambia a mobile-menu-open, display: block, aria-label «Cerrar menú»."));
  content.push(bullet("Screenshot del menú abierto: VLM confirma 6 opciones visibles (Inicio, Servicios, Tecnologías, Trabajos, Conócenos, Contacto) + botón «Solicitar cotización»."));
  content.push(bullet("Click en link «Servicios»: menú se cierra automáticamente (mobile-menu-closed, display none, aria-label vuelve a «Abrir menú»)."));
  content.push(h3("Resultado"));
  content.push(bullet("Botón hamburguesa del header totalmente funcional en producción (HTML standalone)."));
  content.push(bullet("Menú se abre, muestra las 6 opciones de navegación + botón cotización."));
  content.push(bullet("Menú se cierra al: clic en link, clic fuera del header, o tecla Escape."));
  content.push(bullet("Icono alterna entre hamburguesa (Menu) y X correctamente."));
  content.push(bullet("Smooth scroll restaurado para todas las anclas #."));

  content.push(spacer(200));

  // ═══════════════════════════════════════════════════════
  // 5. ESTADO ACTUAL DEL PROYECTO
  // ═══════════════════════════════════════════════════════
  content.push(h1("5. Estado Actual del Proyecto"));

  content.push(h2("5.1 Lo que está funcionando en producción"));
  content.push(bullet("Sitio web público en https://sun-runers.pages.dev (Cloudflare Pages)."));
  content.push(bullet("HTML standalone autocontenido (1.35 MB): CSS inlineado + 7 imágenes embebidas como data URIs."));
  content.push(bullet("Navegación responsive desktop y móvil con menú hamburguesa funcional."));
  content.push(bullet("6 secciones: Hero, Servicios, Tecnologías, Trabajos, Conócenos, Contacto."));
  content.push(bullet("Logo vectorial SVG 100% fiel al original, con wordmark de texto en header y footer."));
  content.push(bullet("Animación de intro de 3 segundos (fondo negro + logo blanco), respeta prefers-reduced-motion."));
  content.push(bullet("Header con contraste adaptativo (transparente sobre hero, sólido off-white al hacer scroll)."));
  content.push(bullet("Formulario de contacto operativo con asignación automática de ingeniero por proximidad geográfica (algoritmo haversine)."));
  content.push(bullet("Base de datos D1 con 2 tablas (contact_request, automation_log) persistiendo solicitudes."));
  content.push(bullet("Endpoint /api/health para diagnóstico de configuración."));
  content.push(bullet("Endpoint /api/contact que recibe solicitudes, asigna ingeniero, y registra logs."));
  content.push(bullet("16 marcas cubanas documentadas en la sección Tecnologías."));
  content.push(bullet("Smooth scroll para todas las anclas # (vanilla JS en standalone)."));
  content.push(spacer(200));

  content.push(h2("5.2 Lo que NO está funcionando aún"));
  content.push(bullet([{ text: "Envío de emails reales: ", bold: true }, { text: "Brevo está integrado y el código está listo, pero falta que el usuario configure BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_NOTIFY_EMAIL y WHATSAPP_PUBLIC_NUMBER como secrets del proyecto Pages vía `wrangler pages secret put <NAME> --project-name=sun-runers`. Mientras tanto, las solicitudes se persisten en D1 pero no se envían emails." }]));
  content.push(bullet([{ text: "Fotos reales: ", bold: true }, { text: "Las 7 imágenes actuales (hero + 6 portfolio) son placeholders generados con IA. Cuando el usuario tenga fotos reales de trabajos/instalaciones, se reemplazan en public/assets/portfolio/p1.jpg ... p6.jpg y hero.jpg, se regenera el standalone y se redeploya." }]));
  content.push(bullet([{ text: "Datos de ingenieros: ", bold: true }, { text: "Los 4 perfiles de ingenieros en la sección Conócenos tienen datos placeholder (nombre «Ing. — —», experiencia 0 años, bio genérica). El usuario debe actualizar ENGINEERS_PUBLIC y ENGINEERS_PRIVATE en src/lib/site-data.ts con los datos reales." }]));
  content.push(bullet([{ text: "Dominio personalizado: ", bold: true }, { text: "La URL actual es https://sun-runers.pages.dev. Cuando el usuario compre el dominio sun-runers.cu, se vincula como Custom Domain en Cloudflare Pages." }]));
  content.push(spacer(200));

  // ═══════════════════════════════════════════════════════
  // 6. PENDIENTES Y PRÓXIMOS PASOS
  // ═══════════════════════════════════════════════════════
  content.push(h1("6. Pendientes y Próximos Pasos"));

  content.push(h2("6.1 Pendientes con el usuario"));
  content.push(makeTable(
    ["Pendiente", "Acción requerida", "Prioridad"],
    [
      ["Configurar Brevo", "Crear cuenta en Brevo, verificar email Gmail, pegar BREVO_API_KEY como secret del proyecto Pages", "Alta"],
      ["Fotos reales", "Tomar fotos de trabajos/instalaciones reales y reemplazar placeholders", "Media"],
      ["Datos de ingenieros", "Actualizar src/lib/site-data.ts con nombres, bios, especialidades, fotos y coordenadas reales", "Alta"],
      ["WhatsApp Business", "Configurar WhatsApp Business API para notificaciones a ingenieros", "Media"],
      ["Comprar dominio", "Adquirir sun-runers.cu y vincularlo como Custom Domain", "Baja"],
      ["Revocar API token", "Eliminar el API token de Cloudflare tras finalizar todo el trabajo", "Baja"],
    ]
  ));
  content.push(spacer(200));

  content.push(h2("6.2 Próximas automatizaciones (siguiente fase)"));
  content.push(body(
    "El usuario ha indicado que la siguiente fase del proyecto consistirá en implementar automatizaciones. Este documento sirve como punto de restauración de contexto antes de comenzar esa fase. Las automatizaciones probablemente incluirán:"
  ));
  content.push(bullet("Notificaciones automáticas por WhatsApp a los ingenieros cuando llegue una solicitud nueva."));
  content.push(bullet("Confirmación automática por email al cliente con la información del ingeniero asignado."));
  content.push(bullet("Posible integración con calendario para agendar visitas técnicas."));
  content.push(bullet("Dashboard administrativo para gestionar solicitudes y asignaciones."));
  content.push(bullet("Recordatorios automáticos de mantenimiento a clientes existentes."));
  content.push(spacer(200));

  // ═══════════════════════════════════════════════════════
  // 7. APÉNDICE: ESTRUCTURA DE ARCHIVOS
  // ═══════════════════════════════════════════════════════
  content.push(h1("7. Apéndice: Estructura de Archivos Clave"));

  content.push(h2("7.1 Código fuente (src/)"));
  content.push(makeTable(
    ["Archivo", "Función"],
    [
      ["src/app/page.tsx", "Página principal con las 6 secciones"],
      ["src/app/layout.tsx", "Layout raíz con metadata SEO"],
      ["src/app/globals.css", "Estilos globales + animaciones intro"],
      ["src/lib/site-data.ts", "Datos de la compañía, servicios, marcas, portfolio, ingenieros"],
      ["src/lib/types.ts", "Tipos TypeScript del dominio"],
      ["src/lib/brevo.ts", "Cliente de la API de Brevo"],
      ["src/lib/email-templates.ts", "Plantillas HTML de emails"],
      ["src/components/site/Header.tsx", "Header con menú móvil funcional"],
      ["src/components/site/Footer.tsx", "Footer con wordmark de texto"],
      ["src/components/site/Logo.tsx", "Logo SVG (14 paths inline)"],
      ["src/components/site/IntroAnimation.tsx", "Animación de intro de 3s"],
      ["src/components/site/Hero.tsx", "Sección Hero con imagen de fondo"],
      ["src/components/site/Services.tsx", "Sección Servicios (5 servicios)"],
      ["src/components/site/Technologies.tsx", "Sección Tecnologías (16 marcas)"],
      ["src/components/site/Portfolio.tsx", "Sección Trabajos (6 proyectos)"],
      ["src/components/site/About.tsx", "Sección Conócenos (4 ingenieros)"],
      ["src/components/site/Contact.tsx", "Formulario de contacto"],
    ]
  ));
  content.push(spacer(200));

  content.push(h2("7.2 Deploy (pages-deploy/)"));
  content.push(makeTable(
    ["Archivo", "Función"],
    [
      ["pages-deploy/wrangler.toml", "Configuración de Cloudflare Pages (nombre, bindings D1, vars)"],
      ["pages-deploy/public/index.html", "HTML standalone autocontenido (1.35 MB)"],
      ["pages-deploy/public/favicon.svg", "Favicon SVG (icono del sol + 3 rayos)"],
      ["pages-deploy/functions/api/[[path]].ts", "Pages Function catch-all para /api/*"],
      ["pages-deploy/functions/api/_brevo.ts", "Cliente Brevo (auxiliar)"],
      ["pages-deploy/functions/api/_email-templates.ts", "Plantillas de email (auxiliar)"],
      ["pages-deploy/functions/api/_site-data.ts", "Datos del sitio (auxiliar)"],
    ]
  ));
  content.push(spacer(200));

  content.push(h2("7.3 Scripts (scripts/)"));
  content.push(makeTable(
    ["Script", "Función"],
    [
      ["scripts/build-standalone-html.py", "Genera el HTML standalone autocontenido desde el dev server"],
      ["scripts/build-logo-svg.py", "Combina icono + wordmark en un SVG único"],
      ["scripts/trace-v3.py", "Vectoriza el icono (sol + 3 rayos) con marching squares + RDP"],
      ["scripts/trace-text.py", "Vectoriza el wordmark «SUN-RUNERS» (10 letras)"],
      ["scripts/extract-geometry.py", "Extrae geometría precisa del sol y los rayos"],
      ["scripts/analyze-logo.py", "Análisis del PNG original (bbox, componentes conectados)"],
      ["scripts/brands_research.md", "Reporte de investigación de marcas cubanas"],
    ]
  ));
  content.push(spacer(200));

  content.push(h2("7.4 Documentos de referencia (download/)"));
  content.push(makeTable(
    ["Archivo", "Función"],
    [
      ["download/SUN-RUNNERS-RESTORE-POINT.md", "Punto de restauración de contexto original"],
      ["download/HELORA-GUIA-IMPLEMENTACION.md", "Guía de implementación Cloudflare + Brevo + WhatsApp"],
      ["download/README.md", "README del proyecto"],
    ]
  ));
  content.push(spacer(200));

  content.push(h2("7.5 Base de datos D1"));
  content.push(body("Schema de la base de datos (migración 0001_init.sql):"));
  content.push(makeTable(
    ["Tabla", "Campos", "Función"],
    [
      ["contact_request", "id, created_at, name, phone, email, address, service_type, message, assigned_engineer_id, assigned_zone, status", "Almacena todas las solicitudes de contacto del formulario"],
      ["automation_log", "id, created_at, request_id, event_type, status, details", "Log de auditoría de eventos (email_sent, email_skipped, etc.)"],
    ]
  ));

  return content;
}

// ─── Build document ───
const doc = new Document({
  creator: "SUN-RUNERS Build System",
  title: "SUN-RUNERS — Documento de Registro del Proyecto",
  description: "Registro completo del trabajo realizado en el proyecto SUN-RUNERS",
  styles: {
    default: {
      document: {
        run: {
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          size: 22,
          color: c(P.body),
        },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: {
          font: { ascii: "Calibri", eastAsia: "SimHei" },
          size: 32, bold: true, color: c(P.primary),
        },
        paragraph: { spacing: { before: 480, after: 200 } },
      },
      heading2: {
        run: {
          font: { ascii: "Calibri", eastAsia: "SimHei" },
          size: 28, bold: true, color: c(P.primary),
        },
        paragraph: { spacing: { before: 360, after: 160 } },
      },
      heading3: {
        run: {
          font: { ascii: "Calibri", eastAsia: "SimHei" },
          size: 24, bold: true, color: c(P.primary),
        },
        paragraph: { spacing: { before: 280, after: 120 } },
      },
    },
  },
  sections: [
    // ─── Cover section (no header/footer, no page numbers) ───
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
        },
      },
      children: buildCover(),
    },
    // ─── Body section (with header, footer, page numbers from 1) ───
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({
              text: "SUN-RUNERS — Documento de Registro del Proyecto",
              size: 18, color: c(P.secondary), italics: true,
              font: { ascii: "Calibri" },
            })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Página ",
                size: 18, color: c(P.secondary),
                font: { ascii: "Calibri" },
              }),
              new TextRun({
                children: [PageNumber.CURRENT],
                size: 18, color: c(P.secondary),
                font: { ascii: "Calibri" },
              }),
              new TextRun({
                text: " de ",
                size: 18, color: c(P.secondary),
                font: { ascii: "Calibri" },
              }),
              new TextRun({
                children: [PageNumber.TOTAL_PAGES],
                size: 18, color: c(P.secondary),
                font: { ascii: "Calibri" },
              }),
            ],
          })],
        }),
      },
      children: buildBody(),
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const outPath = "/home/z/my-project/download/SUN-RUNERS-REGISTRO-COMPLETO.docx";
  fs.writeFileSync(outPath, buf);
  const sizeKB = (buf.length / 1024).toFixed(1);
  console.log(`✅ Documento generado: ${outPath}`);
  console.log(`   Tamaño: ${sizeKB} KB`);
}).catch((err) => {
  console.error("❌ Error generando documento:", err);
  process.exit(1);
});
