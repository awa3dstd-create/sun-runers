// SUN-RUNNERS — Datos del sitio (versión Worker)
// Igual que src/lib/site-data.ts del Next.js, pero solo lo que el Worker necesita.

import type { Service, EngineerPrivate } from "./types";

export const COMPANY = {
  name: "SUN-RUNNERS",
  legalName: "SUN-RUNNERS — Ingeniería en Energía",
  email: "contacto@sun-runners.cu",
  phone: "+53 5 000 0000",
  city: "La Habana, Cuba",
  hours: "Lun–Sáb · 8:00–18:00",
} as const;

export const SERVICES: Service[] = [
  { id: "fotovoltaico", title: "Sistemas fotovoltaicos con respaldo de batería", short: "Solar + almacenamiento" },
  { id: "residencial", title: "Instalaciones eléctricas residenciales", short: "Eléctrico residencial" },
  { id: "bombeo", title: "Automatización de sistemas de bombeo de agua", short: "Bombeo automatizado" },
  { id: "proyectos", title: "Levantamiento, confección y gestión de proyectos", short: "Gestión de proyectos" },
  { id: "clima", title: "Instalación y mantenimiento de sistemas de clima", short: "Clima" },
];

// ⚠️ Datos privados — solo servidor. NUNCA exponer al cliente.
export const ENGINEERS_PRIVATE: EngineerPrivate[] = [
  {
    id: "ing-1",
    lat: 23.1136,
    lng: -82.3666,
    coverageZone: "La Habana — Centro y Oeste",
    whatsapp: "+53500000001",
    email: "ing-1@sun-runners.cu",
  },
  {
    id: "ing-2",
    lat: 23.0892,
    lng: -82.2889,
    coverageZone: "La Habana — Este y Guanabacoa",
    whatsapp: "+53500000002",
    email: "ing-2@sun-runners.cu",
  },
  {
    id: "ing-3",
    lat: 22.8069,
    lng: -81.2431,
    coverageZone: "Matanzas y Varadero",
    whatsapp: "+53500000003",
    email: "ing-3@sun-runners.cu",
  },
  {
    id: "ing-4",
    lat: 20.0247,
    lng: -77.7867,
    coverageZone: "Camagüey y oriente central",
    whatsapp: "+53500000004",
    email: "ing-4@sun-runners.cu",
  },
];
