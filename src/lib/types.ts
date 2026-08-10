// Tipos centrales del sitio SUN-RUNERS
// Todos los datos sensibles (direcciones de ingenieros, teléfonos)
// viven en código servidor y NUNCA se exponen al cliente.

export type ServiceId =
  | "fotovoltaico"
  | "residencial"
  | "bombeo"
  | "proyectos"
  | "clima";

export interface Service {
  id: ServiceId;
  title: string;
  short: string;
  description: string;
  bullets: string[];
  icon: string; // nombre de icono Lucide
}

export interface Brand {
  name: string;
  origin: string;
  category: "Inversor" | "Batería" | "Inversor + Batería" | "Distribuidor";
  lines: string;
  notes: string;
  /** Ruta relativa a /public de la imagen del equipo (opcional). */
  image?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  location: string;
  description: string;
  image: string;
}

// Datos públicos del ingeniero (los que se muestran en la web)
export interface EngineerPublic {
  id: string;
  name: string;
  role: string;
  initials: string;
  experienceYears: number;
  specialties: string[];
  bio: string;
  photo?: string; // URL opcional; si no hay, se usa monograma
}

// Datos PRIVADOS del ingeniero (servidor únicamente)
// NO se importan desde componentes cliente.
export interface EngineerPrivate {
  id: string;
  // Coordenadas aproximadas de residencia para cálculo de proximidad
  // (algoritmo haversine contra la dirección del cliente)
  lat: number;
  lng: number;
  // Municipio / zona de cobertura preferida
  coverageZone: string;
  // Teléfono con código internacional para WhatsApp Business API
  whatsapp: string;
  // Email directo del ingeniero (notificación interna)
  email: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  address: string;
  // Coordenadas opcionales que el frontend puede geocodificar
  lat?: number;
  lng?: number;
  service: ServiceId;
  message: string;
  preferredChannel: "whatsapp" | "email" | "call";
}
