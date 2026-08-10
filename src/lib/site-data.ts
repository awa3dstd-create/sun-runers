import type {
  Brand,
  EngineerPrivate,
  EngineerPublic,
  PortfolioItem,
  Service,
} from "@/lib/types";

/**
 * SUN-RUNERS — Ingeniería en energía, automatización y clima.
 *
 * Manifiesto de marca:
 *  - Nombre: SUN-RUNERS (sol + corredores → energía en movimiento).
 *  - Identidad visual: sol con corte diagonal del que emergen tres rayos
 *    paralelos, simulando velocidad y energía solar en acción.
 *  - Logo vectorial 100% fiel al diseño original del cliente.
 */

export const COMPANY = {
  name: "SUN-RUNERS",
  legalName: "SUN-RUNERS — Ingeniería en Energía",
  tagline: "Ingeniería que perdura.",
  description:
    "Diseñamos, instalamos y mantenemos sistemas fotovoltaicos con respaldo de batería, instalaciones eléctricas residenciales, automatización de bombeo y soluciones de clima. Ingeniería ejecutada con precisión, materiales certificados y estándar internacional.",
  email: "contacto@sun-runers.cu",
  // Teléfono público de la compañía (no de ingenieros individuales)
  phone: "+53 5 000 0000",
  city: "La Habana, Cuba",
  coverage: "Toda Cuba — La Habana, Matanzas, Villa Clara, Camagüey, Santiago de Cuba",
  hours: "Lun–Sáb · 8:00–18:00",
  social: {
    instagram: "@sun-runers.cu",
    facebook: "SUN-RUNERS Cuba",
  },
} as const;

export const SERVICES: Service[] = [
  {
    id: "fotovoltaico",
    title: "Sistemas fotovoltaicos con respaldo de batería",
    short: "Solar + almacenamiento",
    description:
      "Diseño, dimensionamiento, instalación y puesta en marcha de sistemas fotovoltaicos híbridos y off-grid con bancos de baterías de litio (LiFePO4). Trabajamos con inversores y baterías de las marcas líderes del mercado cubano, garantizando autonomía real ante apagones y máxima generación durante todo el año.",
    bullets: [
      "Dimensionamiento según consumo real y autonomía requerida",
      "Inversores híbridos 3–12 kW con MPPT de alto rango",
      "Bancos LiFePO4 24V / 48V / 51.2V modulares",
      "Sistemas split-phase 120/240V y 110/220V",
      "Monitoreo remoto de generación y estado de carga",
      "Mantenimiento preventivo y garantía sobre la instalación",
    ],
    icon: "Sun",
  },
  {
    id: "residencial",
    title: "Instalaciones eléctricas residenciales",
    short: "Eléctrico residencial",
    description:
      "Instalaciones eléctricas completas para viviendas, reformas y ampliaciones de tableros. Cumplimiento de normas cubanas e internacionales, materiales de primera calidad y mano de obra certificada. Cada circuito queda documentado y etiquetado para futuras intervenciones.",
    bullets: [
      "Tableros principales y subtableros con diferencial y termomagnéticos",
      "Cableado certificado, embutido o superficial",
      "Sistema de puesta a tierra (PAT)",
      "Iluminación LED de bajo consumo",
      "Diagnóstico y corrección de instalaciones existentes",
      "Certificación de instalación conforme",
    ],
    icon: "Zap",
  },
  {
    id: "bombeo",
    title: "Automatización de sistemas de bombeo de agua",
    short: "Bombeo automatizado",
    description:
      "Automatización de bombas de agua para residencias, fincas y pequeñas industrias. Sistemas con bombas solares directas, controladores VFD, tanques de reserva y sensores de nivel. Reducimos el consumo eléctrico y garantizamos suministro continuo sin intervención manual.",
    bullets: [
      "Bombas solares DC directas y bombas AC con VFD",
      "Control de nivel por sondas y flotadores",
      "Tanques pulmón y de reserva con conmutación automática",
      "Telemetría opcional de caudal y presión",
      "Protección contra marcha en seco y sobretensión",
      "Mantenimiento programado de bombas y circuitos",
    ],
    icon: "Droplets",
  },
  {
    id: "proyectos",
    title: "Levantamiento, confección y gestión de proyectos",
    short: "Gestión de proyectos",
    description:
      "Servicio integral de ingeniería de proyectos eléctricos: levantamiento en sitio, memorias técnicas, cálculo de cargas, planos eléctricos, presupuesto y gestión de permisos. Acompañamos al cliente desde la idea hasta la puesta en servicio, con documentación entregable conforme a normativa.",
    bullets: [
      "Levantamiento topográfico y eléctrico en sitio",
      "Memoria de cálculo y especificaciones técnicas",
      "Planos eléctricos unifilares y arquitectónicos",
      "Presupuesto detallado por partidas",
      "Gestión de permisos y trámites legales",
      "Supervisión técnica y control de calidad",
    ],
    icon: "ClipboardList",
  },
  {
    id: "clima",
    title: "Instalación y mantenimiento de sistemas de clima",
    short: "Clima",
    description:
      "Instalación, montaje y mantenimiento de sistemas de aire acondicionado split, inverter y VRV/VRF. Cálculo de carga térmica, selección de equipos eficientes y configuración óptima para reducir el consumo eléctrico. Mantenimiento preventivo y correctivo para extender la vida útil de los equipos.",
    bullets: [
      "Cálculo de carga térmica por ambientes",
      "Splits inverter 12.000–60.000 BTU",
      "Sistemas VRV/VRF para comercios y residencias",
      "Mantenimiento preventivo trimestral",
      "Carga de gas y diagnóstico de fugas",
      "Higienización de unidades y ductos",
    ],
    icon: "Wind",
  },
];

/**
 * Marcas presentes en el mercado cubano.
 * Investigación completa en /home/z/my-project/scripts/brands_research.md
 */
export const BRANDS: Brand[] = [
  {
    name: "MUST",
    origin: "China",
    category: "Inversor + Batería",
    lines: "PV1800 VHM · HBP1800 OLV · 6KW 51.2V",
    notes: "Marca más instalada en Cuba. Híbridos 5–6 kW con MPPT 80 A y bancos LiFePO4 integrados.",
    image: "/assets/brands/must.jpg",
  },
  {
    name: "Sunri",
    origin: "China",
    category: "Inversor",
    lines: "Híbrido 4 kW · 3.6 kW (24V / 48V)",
    notes: "Muy popular en redes sociales cubanas. Híbridos compactos para residencial.",
  },
  {
    name: "BC Energy",
    origin: "Cuba (BC Suministros)",
    category: "Distribuidor",
    lines: "Kits Sumry 4K + MUST + LONGi",
    notes: "MIPYME cubana que comercializa kits completos con paneles LONGi 615 W.",
    image: "/assets/brands/longi.jpg",
  },
  {
    name: "Sunshine",
    origin: "China",
    category: "Inversor",
    lines: "5 KW · 6.4 KW · 10 KW (48V)",
    notes: "Inversores de 5–10 kW para residencias medianas y comerciales.",
  },
  {
    name: "Deye",
    origin: "China",
    category: "Inversor",
    lines: "Sun-3K–8K SG01 · Hybrid",
    notes: "Eficiencia 97–99 %. Comúnmente emparejado con baterías Pylontech.",
    image: "/assets/brands/deye.jpg",
  },
  {
    name: "Growatt",
    origin: "China",
    category: "Inversor",
    lines: "SPF 3000–5000 ES · MOD",
    notes: "Híbridos off-grid muy adoptados en Cuba por su relación precio/prestaciones.",
    image: "/assets/brands/growatt.jpg",
  },
  {
    name: "Felicity Solar",
    origin: "China",
    category: "Inversor + Batería",
    lines: "IVPM · FLA24200 5 kWh",
    notes: "Distribuidor oficial en Cuba (SunCar). Línea integrada inversor + batería.",
    image: "/assets/brands/felicity.jpg",
  },
  {
    name: "Pylontech",
    origin: "China",
    category: "Batería",
    lines: "US2000C · US3000C · US5000 · UF5000",
    notes: "Batería LiFePO4 modular. Compatibilidad universal con Deye, Growatt, Voltronic, Victron.",
    image: "/assets/brands/pylontech.jpg",
  },
  {
    name: "Voltronic / Axpert",
    origin: "Taiwán / China",
    category: "Inversor",
    lines: "Axpert MKS · VMIII · MAX",
    notes: "Fabricante ODM que abastece a MPP Solar, Easun y otros. Off-grid robusto.",
    image: "/assets/brands/voltronic.jpg",
  },
  {
    name: "Eco-Worthy",
    origin: "China",
    category: "Inversor + Batería",
    lines: "Cubix100 48V · Inversores 3–5 kW",
    notes: "Solución económica todo-en-uno para residencial pequeño.",
  },
  {
    name: "GoodWe",
    origin: "China",
    category: "Inversor",
    lines: "ES G2 · EM Series",
    notes: "Híbridos bidireccionales premium con gestión de energía avanzada.",
  },
  {
    name: "SolaX",
    origin: "China",
    category: "Inversor",
    lines: "X-Hybrid · SK-SU",
    notes: "Híbridos con respaldo nativo y monitoreo en la nube.",
  },
  {
    name: "SRNE",
    origin: "China",
    category: "Inversor",
    lines: "HESP · ML24/48",
    notes: "Inversores híbridos económicos, muy usados en zonas rurales.",
  },
  {
    name: "Easun",
    origin: "China",
    category: "Inversor",
    lines: "ISolar SM · SHP",
    notes: "Off-grid fabricado por Voltronic. Buena relación precio/prestaciones.",
  },
  {
    name: "Victron Energy",
    origin: "Países Bajos",
    category: "Inversor + Batería",
    lines: "MultiPlus-II · Cerbo GX",
    notes: "Premium europeo. Soluciones modulares para residencias exigentes.",
    image: "/assets/brands/victron.jpg",
  },
  {
    name: "Huawei",
    origin: "China",
    category: "Inversor",
    lines: "SUN2000 (3–10 KTL)",
    notes: "Inversores string de alta eficiencia. Presencia creciente en Cuba.",
  },
];

export const PORTFOLIO: PortfolioItem[] = [
  {
    id: "p1",
    title: "Sistema fotovoltaico residencial 5 kW",
    category: "Fotovoltaico + batería",
    location: "La Habana",
    description:
      "Instalación de 12 paneles de 550 W con inversor híbrido MUST 5 kW y banco LiFePO4 51.2 V / 200 Ah. Autonomía de 18 horas ante cortes.",
    image: "/assets/portfolio/p1.jpg",
  },
  {
    id: "p2",
    title: "Banco de baterías LiFePO4 10 kWh",
    category: "Almacenamiento",
    location: "Matanzas",
    description:
      "Banco modular de 2 × Pylontech US5000 con barras de cobre dimensionadas y gabinete de protección. Monitoreo remoto por CAN bus.",
    image: "/assets/portfolio/p2.jpg",
  },
  {
    id: "p3",
    title: "Inversor híbrido 6 kW con ATS",
    category: "Fotovoltaico + batería",
    location: "La Habana",
    description:
      "Inversor Sunshine 6.4 kW con transferencia automática, configurado para priorizar generación solar y respaldo total ante apagones.",
    image: "/assets/portfolio/p3.jpg",
  },
  {
    id: "p4",
    title: "Bombeo solar para finca agrícola",
    category: "Automatización de bombeo",
    location: "Villa Clara",
    description:
      "Bomba solar DC directa de 1.5 kW con tanque elevado de 5 000 L y sondas de nivel. Cero consumo eléctrico de la red.",
    image: "/assets/portfolio/p4.jpg",
  },
  {
    id: "p5",
    title: "Clima inverter 36 000 BTU",
    category: "Clima",
    location: "La Habana",
    description:
      "Instalación de split inverter 36 000 BTU con cálculo de carga térmica, drenaje oculto y protección eléctrica diferencial.",
    image: "/assets/portfolio/p5.jpg",
  },
  {
    id: "p6",
    title: "Tablero principal residencial",
    category: "Eléctrico residencial",
    location: "Santiago de Cuba",
    description:
      "Tablero principal con diferencial 40 A, 18 circuitos termomagnéticos, sistema de puesta a tierra y etiquetado completo.",
    image: "/assets/portfolio/p6.jpg",
  },
];

/**
 * Ingenieros — datos PÚBLICOS visibles en la web.
 *
 * El usuario irá actualizando esta lista. Estructura lista para recibir:
 *  - photo: ruta de imagen en /public/assets/team/
 *  - bio: biografía profesional
 *  - specialties: áreas de especialización
 *
 * Ejemplo de carga de un ingeniero real:
 *
 * {
 *   id: "ing-1",
 *   name: "Ing. Roberto Suárez Martínez",
 *   role: "Director Técnico",
 *   initials: "RS",
 *   experienceYears: 14,
 *   specialties: ["Sistemas fotovoltaicos", "Almacenamiento LiFePO4"],
 *   bio: "Ingeniero Electricista...",
 *   photo: "/assets/team/ing-1.jpg"
 * }
 *
 * Mientras no haya foto, se muestra un monograma con las iniciales.
 */
export const ENGINEERS_PUBLIC: EngineerPublic[] = [
  {
    id: "ing-1",
    name: "Ing. — —",
    role: "Director Técnico",
    initials: "—",
    experienceYears: 0,
    specialties: ["Por actualizar"],
    bio: "Espacio reservado para la biografía del ingeniero. Este perfil será actualizado con la información profesional completa, años de experiencia, formación académica y proyectos destacados.",
  },
  {
    id: "ing-2",
    name: "Ing. — —",
    role: "Responsable de Fotovoltaica",
    initials: "—",
    experienceYears: 0,
    specialties: ["Por actualizar"],
    bio: "Espacio reservado para la biografía del ingeniero. Este perfil será actualizado con la información profesional completa, años de experiencia, formación académica y proyectos destacados.",
  },
  {
    id: "ing-3",
    name: "Ing. — —",
    role: "Responsable de Automatización",
    initials: "—",
    experienceYears: 0,
    specialties: ["Por actualizar"],
    bio: "Espacio reservado para la biografía del ingeniero. Este perfil será actualizado con la información profesional completa, años de experiencia, formación académica y proyectos destacados.",
  },
  {
    id: "ing-4",
    name: "Ing. — —",
    role: "Responsable de Clima y Mantenimiento",
    initials: "—",
    experienceYears: 0,
    specialties: ["Por actualizar"],
    bio: "Espacio reservado para la biografía del ingeniero. Este perfil será actualizado con la información profesional completa, años de experiencia, formación académica y proyectos destacados.",
  },
];

/**
 * ⚠️ DATOS PRIVADOS — Solo servidor.
 *
 * NO importar desde componentes cliente (los que tienen 'use client').
 * NO exponer en respuestas de API públicas.
 *
 * Estos datos alimentan el algoritmo de asignación de ingeniero
 * por proximidad geográfica, que se ejecuta en el endpoint
 * /api/contact cuando llega una solicitud nueva.
 *
 * El cliente nunca ve estos datos. Solo se usan para:
 *   1. Calcular el ingeniero más cercano a la dirección del cliente.
 *   2. Enviar notificación interna (WhatsApp/Email) al ingeniero asignado.
 *
 * Las coordenadas son aproximadas (centro del municipio) por privacidad.
 * El cálculo real puede refinarse con geocoding exacto del cliente.
 */
export const ENGINEERS_PRIVATE: EngineerPrivate[] = [
  {
    id: "ing-1",
    lat: 23.1136, // La Habana
    lng: -82.3666,
    coverageZone: "La Habana — Centro y Oeste",
    whatsapp: "+53500000001",
    email: "ing-1@sun-runers.cu",
  },
  {
    id: "ing-2",
    lat: 23.0892, // La Habana Este
    lng: -82.2889,
    coverageZone: "La Habana — Este y Guanabacoa",
    whatsapp: "+53500000002",
    email: "ing-2@sun-runers.cu",
  },
  {
    id: "ing-3",
    lat: 22.8069, // Matanzas
    lng: -81.2431,
    coverageZone: "Matanzas y Varadero",
    whatsapp: "+53500000003",
    email: "ing-3@sun-runers.cu",
  },
  {
    id: "ing-4",
    lat: 20.0247, // Camagüey
    lng: -77.7867,
    coverageZone: "Camagüey y oriente central",
    whatsapp: "+53500000004",
    email: "ing-4@sun-runers.cu",
  },
];

export const NAV_ITEMS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#servicios", label: "Servicios" },
  { href: "#tecnologias", label: "Tecnologías" },
  { href: "#trabajos", label: "Trabajos" },
  { href: "#conocenos", label: "Conócenos" },
  { href: "#contacto", label: "Contacto" },
] as const;
