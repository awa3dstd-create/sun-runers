// Algoritmo de asignación por proximidad — Worker version
// Igual que src/lib/engineer-assignment.ts pero sin importar Prisma.

import { ENGINEERS_PRIVATE } from "./_site-data";

const EARTH_RADIUS_KM = 6371;

function haversine(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// 30+ coordenadas Cuba
const PROVINCE_COORDS: Record<string, { lat: number; lng: number }> = {
  "la habana": { lat: 23.1136, lng: -82.3666 },
  habana: { lat: 23.1136, lng: -82.3666 },
  vedado: { lat: 23.132, lng: -82.383 },
  "centro habana": { lat: 23.135, lng: -82.36 },
  "habana vieja": { lat: 23.13, lng: -82.35 },
  "habana del este": { lat: 23.0892, lng: -82.2889 },
  miramar: { lat: 23.073, lng: -82.415 },
  playas: { lat: 23.073, lng: -82.415 },
  guanabacoa: { lat: 23.083, lng: -82.3 },
  cerro: { lat: 23.103, lng: -82.383 },
  "diez de octubre": { lat: 23.115, lng: -82.35 },
  "san miguel": { lat: 23.083, lng: -82.383 },
  boyeros: { lat: 23.05, lng: -82.4 },
  "arroyo naranjo": { lat: 23.066, lng: -82.366 },
  cotorro: { lat: 23.066, lng: -82.333 },
  "la lisa": { lat: 23.05, lng: -82.45 },
  mariel: { lat: 22.99, lng: -82.583 },
  matanzas: { lat: 22.8069, lng: -81.2431 },
  varadero: { lat: 23.15, lng: -81.283 },
  cárdenas: { lat: 22.866, lng: -81.2 },
  cienfuegos: { lat: 22.15, lng: -80.45 },
  "villa clara": { lat: 22.4, lng: -79.966 },
  "santa clara": { lat: 22.4, lng: -79.966 },
  "sancti spíritus": { lat: 21.933, lng: -79.45 },
  "ciego de ávila": { lat: 21.766, lng: -78.766 },
  camagüey: { lat: 20.0247, lng: -77.7867 },
  "las tunas": { lat: 20.95, lng: -76.95 },
  holguín: { lat: 20.883, lng: -76.266 },
  granma: { lat: 20.383, lng: -76.633 },
  bayamo: { lat: 20.383, lng: -76.633 },
  santiago: { lat: 20.0247, lng: -75.82 },
  "santiago de cuba": { lat: 20.0247, lng: -75.82 },
  "guantánamo": { lat: 20.166, lng: -75.2 },
  "isla de la juventud": { lat: 21.733, lng: -82.85 },
  pinar: { lat: 22.416, lng: -83.7 },
  "pinar del río": { lat: 22.416, lng: -83.7 },
};

function inferCoordsFromAddress(address: string): { lat: number; lng: number } | null {
  const lower = address.toLowerCase();
  let best: { key: string; coords: { lat: number; lng: number } } | null = null;
  for (const [key, coords] of Object.entries(PROVINCE_COORDS)) {
    if (lower.includes(key)) {
      if (!best || key.length > best.key.length) {
        best = { key, coords };
      }
    }
  }
  return best?.coords ?? null;
}

export interface AssignmentResult {
  engineerId: string;
  zone: string;
  distanceKm?: number;
  inferred: boolean;
}

export function assignNearestEngineer(
  address: string,
  clientLat?: number,
  clientLng?: number
): AssignmentResult {
  const fallback = ENGINEERS_PRIVATE[0];
  const client =
    clientLat != null && clientLng != null
      ? { lat: clientLat, lng: clientLng }
      : inferCoordsFromAddress(address);

  if (!client) {
    return {
      engineerId: fallback.id,
      zone: fallback.coverageZone,
      inferred: false,
    };
  }

  let best = ENGINEERS_PRIVATE[0];
  let bestDist = haversine(client.lat, client.lng, best.lat, best.lng);

  for (const ing of ENGINEERS_PRIVATE.slice(1)) {
    const d = haversine(client.lat, client.lng, ing.lat, ing.lng);
    if (d < bestDist) {
      best = ing;
      bestDist = d;
    }
  }

  return {
    engineerId: best.id,
    zone: best.coverageZone,
    distanceKm: Math.round(bestDist * 10) / 10,
    inferred: clientLat == null,
  };
}
