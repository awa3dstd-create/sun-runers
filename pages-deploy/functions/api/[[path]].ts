/**
 * SUN-RUNERS — Pages Function: /api/*
 *
 * Catch-all para todas las rutas /api/* — enruta a handlers específicos.
 */

import { assignNearestEngineer } from "./_engineer-assignment";
import { sendEmail } from "./_brevo";
import {
  buildClientConfirmationEmail,
  buildEngineerNotificationEmail,
} from "./_email-templates";
import { ENGINEERS_PRIVATE, SERVICES, COMPANY } from "./_site-data";
import type { ContactPayload } from "./_types";

interface Env {
  DB: D1Database;
  BREVO_API_KEY: string;
  BREVO_FROM_EMAIL: string;
  BREVO_FROM_NAME: string;
  BREVO_NOTIFY_EMAIL: string;
  WHATSAPP_PUBLIC_NUMBER: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  WHATSAPP_CALLMEBOT_PHONE: string;
  WHATSAPP_CALLMEBOT_APIKEY: string;
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

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    if (path === "/api" && request.method === "GET") {
      return json({
        service: "SUN-RUNERS API",
        version: "1.0.0",
        endpoints: ["/api/contact", "/api/health"],
        timestamp: new Date().toISOString(),
      });
    }

    if (path === "/api/health" && request.method === "GET") {
      return json({
        hasApiKey: Boolean(env.BREVO_API_KEY),
        fromEmail: env.BREVO_FROM_EMAIL ?? "",
        fromName: env.BREVO_FROM_NAME ?? "SUN-RUNERS",
        notifyEmail: env.BREVO_NOTIFY_EMAIL ?? "",
        whatsappPublic: env.WHATSAPP_PUBLIC_NUMBER ?? "",
        hasTelegram: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
        hasCallmebot: Boolean(env.WHATSAPP_CALLMEBOT_PHONE && env.WHATSAPP_CALLMEBOT_APIKEY),
        allConfigured:
          Boolean(env.BREVO_API_KEY) &&
          Boolean(env.BREVO_FROM_EMAIL) &&
          Boolean(env.BREVO_NOTIFY_EMAIL),
        environment: env.ENVIRONMENT ?? "production",
        timestamp: new Date().toISOString(),
      });
    }

    if (path === "/api/contact" && request.method === "POST") {
      return await handleContact(request, env);
    }

    if (path === "/api/contact" && request.method === "GET") {
      return await listRequests(env);
    }

    return json({ error: "Not found", path }, 404);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[pages-function] error:", msg);
    return json({ error: "Internal error", detail: msg }, 500);
  }
};

// ──────────────────────────────────────────────────────────
// Handler: POST /api/contact
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

  const assignment = assignNearestEngineer(
    payload.address,
    payload.lat,
    payload.lng
  );

  const id = generateId();
  await env.DB.prepare(
    `INSERT INTO contact_request
       (id, name, email, phone, address, lat, lng, service, message,
        preferred_channel, assigned_engineer_id, assigned_zone, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'nuevo')`
  ).bind(
    id, payload.name, payload.email, payload.phone, payload.address,
    payload.lat ?? null, payload.lng ?? null, payload.service, payload.message,
    payload.preferredChannel, assignment.engineerId, assignment.zone
  ).run();

  await logAction(env, id, "assigned", `Ingeniero ${assignment.engineerId} asignado (${assignment.zone}${
    assignment.distanceKm ? `, ${assignment.distanceKm}km` : ""
  })`, true);

  const summary = {
    clientEmailSent: false,
    companyEmailSent: false,
    callmebotSent: false,
    telegramSent: false,
    brevoConfigured: Boolean(env.BREVO_API_KEY),
  };

  if (env.BREVO_API_KEY) {
    const serviceLabel = SERVICES.find((s) => s.id === payload.service)?.title ?? payload.service;
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
    summary.clientEmailSent = clientResult.success;

    await logAction(env, id, "email_sent",
      `Email de confirmación al cliente (${payload.email})`, clientResult.success);

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
      summary.companyEmailSent = engResult.success;

      await logAction(env, id, "email_sent",
        `Notificación interna al ingeniero (${engineer.email})`, engResult.success);

      if (env.BREVO_NOTIFY_EMAIL && env.BREVO_NOTIFY_EMAIL !== engineer.email) {
        const centralResult = await sendEmail(env, {
          to: [{ email: env.BREVO_NOTIFY_EMAIL, name: COMPANY.name }],
          subject: `[COPIA] ${engEmail.subject}`,
          html: engEmail.html,
          text: engEmail.text,
          tags: ["copia-central", `ing-${engineer.id}`],
        });
        summary.companyEmailSent = centralResult.success;

        await logAction(env, id, "email_sent",
          `Copia al email central (${env.BREVO_NOTIFY_EMAIL})`, centralResult.success);
      }
    }

    const allSent = summary.clientEmailSent && summary.companyEmailSent;
    await env.DB.prepare(
      `UPDATE contact_request SET status = ?, email_sent = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(allSent ? "notificado" : "nuevo", allSent ? 1 : 0, id).run();
  } else {
    await logAction(env, id, "email_skipped",
      "BREVO_API_KEY no configurada. Solicitud persistida pero sin envío de email.", false);
  }

  // ─── TELEGRAM notification ───
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    try {
      const serviceLabel2 = SERVICES.find((s) => s.id === payload.service)?.title ?? payload.service;
      const tgText = [
        "🔔 Nueva solicitud SUN-RUNERS",
        "",
        "Nombre: " + payload.name,
        "Telefono: " + payload.phone,
        "Email: " + payload.email,
        "Direccion: " + payload.address,
        "Servicio: " + serviceLabel2,
        "Canal preferido: " + payload.preferredChannel,
        "Zona asignada: " + assignment.zone,
        "",
        "Mensaje:",
        payload.message,
      ].join("\n");

      const tgResponse = await fetch(
        "https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: tgText,
          }),
        }
      );
      summary.telegramSent = tgResponse.ok;
      await logAction(env, id, "telegram_sent",
        "Notificacion Telegram a chat " + env.TELEGRAM_CHAT_ID, tgResponse.ok);
    } catch (err) {
      console.error("[telegram] error:", err);
    }
  }

  // ─── WHATSAPP via CallMeBot ───
  if (env.WHATSAPP_CALLMEBOT_PHONE && env.WHATSAPP_CALLMEBOT_APIKEY) {
    try {
      const serviceLabel3 = SERVICES.find((s) => s.id === payload.service)?.title ?? payload.service;
      const waText = [
        "Nueva solicitud SUN-RUNERS",
        "",
        "Nombre: " + payload.name,
        "Telefono: " + payload.phone,
        "Email: " + payload.email,
        "Direccion: " + payload.address,
        "Servicio: " + serviceLabel3,
        "Mensaje: " + payload.message.substring(0, 200),
      ].join("\n");

      const waResponse = await fetch(
        "https://api.callmebot.com/whatsapp.php?phone=" + encodeURIComponent(env.WHATSAPP_CALLMEBOT_PHONE) + "&apikey=" + encodeURIComponent(env.WHATSAPP_CALLMEBOT_APIKEY) + "&text=" + encodeURIComponent(waText)
      );
      summary.callmebotSent = waResponse.ok;
      await logAction(env, id, "callmebot_sent",
        "WhatsApp enviado a " + env.WHATSAPP_CALLMEBOT_PHONE, waResponse.ok);
    } catch (err) {
      console.error("[callmebot] error:", err);
    }
  }

  const allSent = summary.clientEmailSent && summary.companyEmailSent;
  await env.DB.prepare(
    "UPDATE contact_request SET status = ?, email_sent = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(allSent ? "notificado" : "nuevo", allSent ? 1 : 0, id).run();

  return json({
    ok: true,
    requestId: id,
    emailsSent: summary,
    message: "Solicitud recibida. Te contactaremos por WhatsApp en menos de 24 horas.",
  });
}

async function listRequests(env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    `SELECT id, name, service, assigned_zone, status, email_sent, created_at
     FROM contact_request
     ORDER BY created_at DESC
     LIMIT 50`
  ).all();
  return json({ requests: result.results ?? [] });
}

async function logAction(
  env: Env, requestId: string, action: string, detail: string, success: boolean
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

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `c${timestamp}${random}`;
}
