/**
 * Módulo de envío de email transaccional vía Brevo.
 *
 * Brevo (antes Sendinblue) — plan free: 300 emails/día.
 * Permite enviar desde una dirección Gmail verificada hacia cualquier
 * destinatario, SIN necesidad de dominio propio.
 *
 * Setup (ver /download/SUN-RUNNERS-GUIA-IMPLEMENTACION.md):
 *   1. Crear cuenta en https://brevo.com
 *   2. Verificar el email remitente (tu Gmail) en Brevo → Senders & IP
 *   3. Generar API key en Brevo → Settings → API Keys
 *   4. Pegar la API key en .env.local como BREVO_API_KEY
 *
 * Variables de entorno requeridas (.env.local):
 *   BREVO_API_KEY=xkeysib-...
 *   BREVO_FROM_EMAIL=sunrunners.cuba@gmail.com
 *   BREVO_FROM_NAME=SUN-RUNNERS
 *   BREVO_NOTIFY_EMAIL=sunrunners.cuba@gmail.com  (email central de la compañía)
 *
 * El número de WhatsApp público va en .env.local:
 *   WHATSAPP_PUBLIC_NUMBER=+53500000000
 *
 * Documentación Brevo API v3:
 *   https://developers.brevo.com/reference/sendtransacemail
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailParams {
  to: EmailRecipient[];
  subject: string;
  html: string;
  // Texto plano para clientes que no renderizan HTML
  text?: string;
  // Reply-To (por defecto el remitente)
  replyTo?: EmailRecipient;
  // Tags para categorizar en el dashboard de Brevo
  tags?: string[];
}

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function getEnv(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

/**
 * Devuelve el estado de configuración de Brevo.
 * Útil para diagnóstico desde el endpoint /api/health.
 */
export function getBrevoConfigStatus() {
  return {
    hasApiKey: Boolean(process.env.BREVO_API_KEY),
    fromEmail: getEnv("BREVO_FROM_EMAIL"),
    fromName: getEnv("BREVO_FROM_NAME", "SUN-RUNNERS"),
    notifyEmail: getEnv("BREVO_NOTIFY_EMAIL"),
    whatsappPublic: getEnv("WHATSAPP_PUBLIC_NUMBER"),
  };
}

/**
 * Envía un email transaccional a través de Brevo.
 *
 * Lanza error si falta la API key. El llamador debe capturar y registrar.
 */
export async function sendEmail(params: SendEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = getEnv("BREVO_FROM_EMAIL");
  const fromName = getEnv("BREVO_FROM_NAME", "SUN-RUNNERS");

  if (!apiKey) {
    return {
      success: false,
      error: "BREVO_API_KEY no configurada en .env.local",
    };
  }

  if (!fromEmail) {
    return {
      success: false,
      error: "BREVO_FROM_EMAIL no configurada en .env.local",
    };
  }

  try {
    const body: Record<string, unknown> = {
      sender: { email: fromEmail, name: fromName },
      to: params.to,
      subject: params.subject,
      htmlContent: params.html,
      replyTo: params.replyTo ?? { email: fromEmail, name: fromName },
    };

    if (params.text) body.textContent = params.text;
    if (params.tags?.length) body.tags = params.tags;

    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[brevo] API error:", res.status, errText);
      return {
        success: false,
        error: `Brevo API ${res.status}: ${errText.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as { messageId?: string };
    return { success: true, messageId: data.messageId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[brevo] error:", msg);
    return { success: false, error: msg };
  }
}
