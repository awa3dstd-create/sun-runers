// Plantillas HTML para emails transaccionales — Worker version
// Idénticas a las del Next.js (HTML tabular compatible Gmail/Outlook)

import type { ContactPayload } from "./_types";
import { COMPANY } from "./_site-data";

interface ClientEmailData {
  name: string;
  service: string;
  zone: string;
  whatsappLink?: string;
}

export function buildClientConfirmationEmail(data: ClientEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, service, zone, whatsappLink } = data;
  const subject = `SUN-RUNERS — Recibimos tu solicitud`;

  const text = `Hola ${name},

Recibimos tu solicitud de "${service}" y la asignamos a nuestro equipo técnico en ${zone}.

Qué sigue:
  • Un ingeniero te contactará en menos de 24 horas hábiles por el canal que indicaste.
  • Si necesitas atención urgente, escríbenos directamente por WhatsApp.

${whatsappLink ? `WhatsApp directo: ${whatsappLink}` : ""}

Gracias por confiar en SUN-RUNERS.

— Equipo SUN-RUNERS
${COMPANY.email}
${COMPANY.phone}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${subject}</title></head>
<body style="margin:0;padding:0;background-color:#F7F5EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F100C;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F5EF;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #DDD6C5;max-width:600px;width:100%;">
        <tr><td style="padding:32px 40px 24px 40px;border-bottom:1px solid #ECE7DA;">
          <span style="display:inline-block;width:28px;height:28px;background-color:#0F100C;border-radius:6px;vertical-align:middle;margin-right:10px;"></span>
          <span style="font-size:18px;font-weight:500;letter-spacing:0.18em;color:#0F100C;vertical-align:middle;">SUN-RUNERS</span>
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 24px 0;font-size:26px;font-weight:500;letter-spacing:-0.02em;color:#0F100C;line-height:1.2;">Hola ${escapeHtml(name)},</h1>
          <p style="margin:0 0 20px 0;font-size:16px;line-height:1.65;color:#4A463E;">
            Recibimos tu solicitud de <strong style="color:#0F100C;">${escapeHtml(service)}</strong> y la asignamos a nuestro equipo técnico en <strong style="color:#0F100C;">${escapeHtml(zone)}</strong>.
          </p>
          <p style="margin:0 0 32px 0;font-size:16px;line-height:1.65;color:#4A463E;">
            Un ingeniero te contactará en menos de <strong style="color:#0F100C;">24 horas hábiles</strong> por el canal que indicaste.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F5EF;border-radius:8px;margin-bottom:32px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 12px 0;font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#B8702E;">Qué sigue</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#4A463E;">
                • Un ingeniero te contactará para coordinar una visita técnica.<br>
                • Llevaremos cabo el levantamiento en sitio sin costo.<br>
                • Recibirás una propuesta técnica y económica detallada.
              </p>
            </td></tr>
          </table>
          ${whatsappLink ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td align="center" style="background-color:#0F100C;border-radius:999px;padding:16px 24px;">
              <a href="${escapeHtml(whatsappLink)}" style="display:block;color:#F7F5EF;text-decoration:none;font-size:15px;font-weight:500;">Escribir por WhatsApp</a>
            </td></tr>
          </table>` : ""}
          <p style="margin:0;font-size:16px;line-height:1.65;color:#4A463E;">Gracias por confiar en nosotros.</p>
          <p style="margin:24px 0 0 0;font-size:15px;color:#0F100C;"><strong>Equipo SUN-RUNERS</strong></p>
        </td></tr>
        <tr><td style="padding:24px 40px;background-color:#F7F5EF;border-top:1px solid #ECE7DA;">
          <p style="margin:0 0 8px 0;font-size:12px;color:#6A655A;line-height:1.5;">${escapeHtml(COMPANY.legalName)} · ${escapeHtml(COMPANY.city)}</p>
          <p style="margin:0;font-size:12px;color:#6A655A;line-height:1.5;">
            <a href="mailto:${escapeHtml(COMPANY.email)}" style="color:#6A655A;text-decoration:none;">${escapeHtml(COMPANY.email)}</a>
            · ${escapeHtml(COMPANY.hours)}
          </p>
        </td></tr>
      </table>
      <p style="margin:20px 0 0 0;font-size:11px;color:#9A9485;text-align:center;">Este email fue enviado automáticamente desde el formulario de contacto de SUN-RUNERS.</p>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

interface EngineerNotificationEmailData {
  engineerName: string;
  client: ContactPayload;
  zone: string;
  requestId: string;
  distanceKm?: number;
}

export function buildEngineerNotificationEmail(
  data: EngineerNotificationEmailData
): { subject: string; html: string; text: string } {
  const { engineerName, client, zone, requestId, distanceKm } = data;
  const subject = `[SUN-RUNERS] Nueva solicitud #${requestId.slice(-8).toUpperCase()} — ${client.service}`;

  const text = `Nueva solicitud asignada — SUN-RUNERS

Ingeniero asignado: ${engineerName}
Zona: ${zone}${distanceKm ? ` (a ${distanceKm} km del cliente)` : ""}

Datos del cliente:
  Nombre: ${client.name}
  Email: ${client.email}
  Teléfono: ${client.phone}
  Dirección: ${client.address}

Servicio solicitado: ${client.service}
Canal preferido: ${client.preferredChannel}

Mensaje del cliente:
${client.message}

—
Sistema de automatización SUN-RUNERS`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${subject}</title></head>
<body style="margin:0;padding:0;background-color:#F7F5EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F100C;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F5EF;padding:24px 16px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #DDD6C5;max-width:640px;width:100%;">
        <tr><td style="padding:24px 32px;background-color:#0F100C;color:#F7F5EF;">
          <span style="font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#B8702E;">Notificación interna · SUN-RUNERS</span>
          <h1 style="margin:8px 0 0 0;font-size:20px;font-weight:500;letter-spacing:-0.02em;color:#F7F5EF;">Nueva solicitud asignada</h1>
          <p style="margin:6px 0 0 0;font-size:13px;color:#A8A395;font-family:monospace;">#${escapeHtml(requestId.slice(-8).toUpperCase())}</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F5EF;border-radius:8px;margin-bottom:28px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#B8702E;">Asignación</p>
              <p style="margin:0;font-size:15px;line-height:1.5;color:#0F100C;">
                <strong>Ingeniero:</strong> ${escapeHtml(engineerName)}<br>
                <strong>Zona:</strong> ${escapeHtml(zone)}${distanceKm ? `<br><strong>Distancia al cliente:</strong> ${distanceKm} km` : ""}
              </p>
            </td></tr>
          </table>
          <h2 style="margin:0 0 16px 0;font-size:13px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#6A655A;">Datos del cliente</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="padding:8px 0;border-bottom:1px solid #ECE7DA;font-size:14px;vertical-align:top;width:120px;"><strong style="color:#0F100C;">Nombre</strong></td><td style="padding:8px 0;border-bottom:1px solid #ECE7DA;font-size:14px;color:#0F100C;">${escapeHtml(client.name)}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #ECE7DA;font-size:14px;vertical-align:top;"><strong style="color:#0F100C;">Email</strong></td><td style="padding:8px 0;border-bottom:1px solid #ECE7DA;font-size:14px;"><a href="mailto:${escapeHtml(client.email)}" style="color:#B8702E;text-decoration:none;">${escapeHtml(client.email)}</a></td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #ECE7DA;font-size:14px;vertical-align:top;"><strong style="color:#0F100C;">Teléfono</strong></td><td style="padding:8px 0;border-bottom:1px solid #ECE7DA;font-size:14px;color:#0F100C;"><a href="tel:${escapeHtml(client.phone.replace(/\s/g, ""))}" style="color:#B8702E;text-decoration:none;">${escapeHtml(client.phone)}</a></td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #ECE7DA;font-size:14px;vertical-align:top;"><strong style="color:#0F100C;">Dirección</strong></td><td style="padding:8px 0;border-bottom:1px solid #ECE7DA;font-size:14px;color:#0F100C;">${escapeHtml(client.address)}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #ECE7DA;font-size:14px;vertical-align:top;"><strong style="color:#0F100C;">Servicio</strong></td><td style="padding:8px 0;border-bottom:1px solid #ECE7DA;font-size:14px;color:#0F100C;">${escapeHtml(client.service)}</td></tr>
            <tr><td style="padding:8px 0;font-size:14px;vertical-align:top;"><strong style="color:#0F100C;">Canal preferido</strong></td><td style="padding:8px 0;font-size:14px;color:#0F100C;text-transform:capitalize;">${escapeHtml(client.preferredChannel)}</td></tr>
          </table>
          <h2 style="margin:0 0 12px 0;font-size:13px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#6A655A;">Mensaje del cliente</h2>
          <blockquote style="margin:0 0 28px 0;padding:16px 20px;background-color:#F7F5EF;border-left:3px solid #B8702E;font-size:14px;line-height:1.65;color:#0F100C;font-style:italic;">${escapeHtml(client.message)}</blockquote>
          <p style="margin:0;font-size:13px;color:#6A655A;line-height:1.5;">Contacta al cliente por el canal preferido en menos de 24 horas hábiles. Esta solicitud quedó registrada en el sistema con estado <strong style="color:#0F100C;">nuevo</strong>.</p>
        </td></tr>
        <tr><td style="padding:20px 32px;background-color:#F7F5EF;border-top:1px solid #ECE7DA;">
          <p style="margin:0;font-size:11px;color:#6A655A;line-height:1.5;">Email automático generado por el sistema de automatización SUN-RUNERS. No respondas directamente a este correo — usa los datos del cliente arriba.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
