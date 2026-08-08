// Tipos centrales — SUN-RUNNERS API
// (versión simplificada del sitio Next.js para el Worker)

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
}

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  address: string;
  lat?: number;
  lng?: number;
  service: ServiceId;
  message: string;
  preferredChannel: "whatsapp" | "email" | "call";
}

export interface EngineerPrivate {
  id: string;
  lat: number;
  lng: number;
  coverageZone: string;
  whatsapp: string;
  email: string;
}
