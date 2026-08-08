/**
 * SUN-RUNNERS — Cloudflare Worker (API + Static Assets)
 *
 * Static assets (HTML/CSS/JS/fonts/SVG) are served automatically
 * by Workers Assets binding (see wrangler.toml `[assets]`).
 * This script only handles non-asset routes (API).
 *
 * API Endpoints:
 *   POST /api/contact   — Recibe solicitud del formulario
 *   GET  /api/contact   — Lista últimas solicitudes
 *   GET  /api/health    — Diagnóstico de configuración
 */

import { assignNearestEngineer } from "./engineer-assignment";
import { sendEmail } from "./brevo";
import {
  buildClientConfirmationEmail,
  buildEngineerNotificationEmail,
} from "./email-templates";
import { ENGINEERS_PRIVATE, SERVICES, COMPANY } from "./site-data";
import type { ContactPayload } from "./types";

export interface Env {
  DB: D1Database;
  BREVO_API_KEY: string;
  BREVO_FROM_EMAIL: string;
  BREVO_FROM_NAME: string;
  BREVO_NOTIFY_EMAIL: string;
  WHATSAPP_PUBLIC_NUMBER: string;
  CORS_ORIGIN: string;
  ENVIRONMENT: string;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
    },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      if (path === "/api" && req.method === "GET") {
        return json({
          service: "SUN-RUNNERS API",
          version: "1.0.0",
          endpoints: ["/api/contact", "/api/health"],
          timestamp: new Date().toISOString(),
        });
      }

      if (path === "/api/health" && req.method === "GET") {
        return json({
          hasApiKey: Boolean(env.BREVO_API_KEY),
          fromEmail: env.BREVO_FROM_EMAIL ?? "",
          fromName: env.BREVO_FROM_NAME ?? "SUN-RUNNERS",
          notifyEmail: env.BREVO_NOTIFY_EMAIL ?? "",
          whatsappPublic: env.WHATSAPP_PUBLIC_NUMBER ?? "",
          allConfigured:
            Boolean(env.BREVO_API_KEY) &&
            Boolean(env.BREVO_FROM_EMAIL) &&
            Boolean(env.BREVO_NOTIFY_EMAIL),
          environment: env.ENVIRONMENT ?? "production",
          timestamp: new Date().toISOString(),
        });
      }

      if (path === "/api/contact" && req.method === "POST") {
        return await handleContact(req, env);
      }

      if (path === "/api/contact" && req.method === "GET") {
        return await listRequests(env);
      }

      return json({ error: "Not found", path }, 404);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[worker] error:", msg);
      return json({ error: "Internal error", detail: msg }, 500);
    }
  },
} satisfies ExportedHandler<Env>;

// ──────────────────────────────────────────────────────────
// Handler: POST /contact
// ──────────────────────────────────────────────────────────
async function handleContact(req: Request, env: Env): Promise<Response> {
  const body = (await req.json()) as Partial<ContactPayload>;

  const required: (keyof ContactPayload)[] = [
    "name", "email", "phone", "address", "service", "message",
  ];
  for (const f of required) {
    const v = body[f];
    if (!v || typeof v !== "string" || v.trim().length < 3) {
      return json({ error: `Campo requerido: ${f}` }, 400);
    }
  }

  const payload: ContactPayload = {
    name: body.name!.trim(),
    email: body.email!.trim(),
    phone: body.phone!.trim(),
    address: body.address!.trim(),
    lat: body.lat,
    lng: body.lng,
    service: body.service!,
    message: body.message!.trim(),
    preferredChannel: body.preferredChannel ?? "whatsapp",
  };

  // 1. Asignación de ingeniero por proximidad
  const assignment = assignNearestEngineer(
    payload.address,
    payload.lat,
    payload.lng
  );

  // 2. Persistir en D1
  const id = generateId();
  await env.DB.prepare(
    `INSERT INTO contact_request
       (id, name, email, phone, address, lat, lng, service, message,
        preferred_channel, assigned_engineer_id, assigned_zone, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'nuevo')`
  ).bind(
    id,
    payload.name,
    payload.email,
    payload.phone,
    payload.address,
    payload.lat ?? null,
    payload.lng ?? null,
    payload.service,
    payload.message,
    payload.preferredChannel,
    assignment.engineerId,
    assignment.zone
  ).run();

  // 3. Log de auditoría
  await logAction(env, id, "assigned", `Ingeniero ${assignment.engineerId} asignado (${assignment.zone}${
    assignment.distanceKm ? `, ${assignment.distanceKm}km` : ""
  })`, true);

  // 4. Envío de emails
  const emailSummary = {
    clientEmailSent: false,
    engineerEmailSent: false,
    centralEmailSent: false,
    brevoConfigured: Boolean(env.BREVO_API_KEY),
  };

  if (env.BREVO_API_KEY) {
    const serviceLabel = SERVICES.find((s) => s.id === payload.service)?.title ?? payload.service;

    // 4a. Email al cliente
    const whatsappLink = env.WHATSAPP_PUBLIC_NUMBER
      ? `https://wa.me/${env.WHATSAPP_PUBLIC_NUMBER.replace(/[^0-9]/g, "")}`
      : undefined;

    const clientEmail = buildClientConfirmationEmail({
      name: payload.name,
      service: serviceLabel,
      zone: assignment.zone,
      whatsappLink,
    });

    const clientResult = await sendEmail(env, {
      to: [{ email: payload.email, name: payload.name }],
      subject: clientEmail.subject,
      html: clientEmail.html,
      text: clientEmail.text,
      tags: ["contacto-cliente", payload.service],
    });
    emailSummary.clientEmailSent = clientResult.success;

    await logAction(env, id, "email_sent",
      `Email de confirmación al cliente (${payload.email})`, clientResult.success);

    // 4b. Email al ingeniero asignado
    const engineer = ENGINEERS_PRIVATE.find((e) => e.id === assignment.engineerId);
    if (engineer) {
      const engEmail = buildEngineerNotificationEmail({
        engineerName: `Ingeniero ${engineer.id.toUpperCase()}`,
        client: payload,
        zone: assignment.zone,
        requestId: id,
        distanceKm: assignment.distanceKm,
      });

      const engResult = await sendEmail(env, {
        to: [{ email: engineer.email }],
        subject: engEmail.subject,
        html: engEmail.html,
        text: engEmail.text,
        tags: ["notificacion-interna", `ing-${engineer.id}`],
      });
      emailSummary.engineerEmailSent = engResult.success;

      await logAction(env, id, "email_sent",
        `Notificación interna al ingeniero (${engineer.email})`, engResult.success);

      // 4c. Copia al email central
      if (env.BREVO_NOTIFY_EMAIL && env.BREVO_NOTIFY_EMAIL !== engineer.email) {
        const centralResult = await sendEmail(env, {
          to: [{ email: env.BREVO_NOTIFY_EMAIL, name: COMPANY.name }],
          subject: `[COPIA] ${engEmail.subject}`,
          html: engEmail.html,
          text: engEmail.text,
          tags: ["copia-central", `ing-${engineer.id}`],
        });
        emailSummary.centralEmailSent = centralResult.success;

        await logAction(env, id, "email_sent",
          `Copia al email central (${env.BREVO_NOTIFY_EMAIL})`, centralResult.success);
      }
    }

    // 5. Actualizar estado
    const allSent = emailSummary.clientEmailSent && emailSummary.engineerEmailSent;
    await env.DB.prepare(
      `UPDATE contact_request SET status = ?, email_sent = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(
      allSent ? "notificado" : "nuevo",
      allSent ? 1 : 0,
      id
    ).run();
  } else {
    await logAction(env, id, "email_skipped",
      "BREVO_API_KEY no configurada. Solicitud persistida pero sin envío de email.", false);
  }

  // 6. Respuesta — NO incluye datos privados
  return json({
    ok: true,
    requestId: id,
    assignedZone: assignment.zone,
    emailsSent: emailSummary,
    message: "Solicitud recibida. Te contactaremos en menos de 24 horas hábiles por el canal indicado.",
  });
}

// ──────────────────────────────────────────────────────────
// Handler: GET /contact (listado interno)
// ──────────────────────────────────────────────────────────
async function listRequests(env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    `SELECT id, name, service, assigned_zone, status, email_sent, created_at
     FROM contact_request
     ORDER BY created_at DESC
     LIMIT 50`
  ).all();

  return json({ requests: result.results ?? [] });
}

// ──────────────────────────────────────────────────────────
// Helper: log a D1
// ──────────────────────────────────────────────────────────
async function logAction(
  env: Env,
  requestId: string,
  action: string,
  detail: string,
  success: boolean
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO automation_log (id, request_id, action, detail, success)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(generateId(), requestId, action, detail, success ? 1 : 0).run();
  } catch (err) {
    console.error("[logAction] error:", err);
  }
}

// ──────────────────────────────────────────────────────────
// Helper: ID generation (cuid-like)
// ──────────────────────────────────────────────────────────
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `c${timestamp}${random}`;
}
