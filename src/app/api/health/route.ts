import { NextResponse } from "next/server";
import { getBrevoConfigStatus } from "@/lib/brevo";

/**
 * Endpoint de diagnóstico.
 *
 * Permite verificar el estado de la configuración de Brevo
 * SIN exponer la API key. Útil para:
 *   - Confirmar que las variables de entorno están cargadas.
 *   - Diagnosticar por qué no se envían emails.
 *
 * Respuesta:
 *   {
 *     "hasApiKey": true,
 *     "fromEmail": "sunrunners.cuba@gmail.com",
 *     "fromName": "SUN-RUNERS",
 *     "notifyEmail": "sunrunners.cuba@gmail.com",
 *     "whatsappPublic": "+53500000000",
 *     "allConfigured": true
 *   }
 */
export async function GET() {
  const status = getBrevoConfigStatus();
  const allConfigured =
    status.hasApiKey &&
    Boolean(status.fromEmail) &&
    Boolean(status.notifyEmail);

  return NextResponse.json({
    ...status,
    allConfigured,
    timestamp: new Date().toISOString(),
  });
}
