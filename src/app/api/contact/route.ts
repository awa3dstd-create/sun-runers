import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assignNearestEngineer } from "@/lib/engineer-assignment";
import { sendEmail, getBrevoConfigStatus } from "@/lib/brevo";
import {
  buildClientConfirmationEmail,
  buildEngineerNotificationEmail,
} from "@/lib/email-templates";
import { ENGINEERS_PRIVATE } from "@/lib/site-data";
import { SERVICES, COMPANY } from "@/lib/site-data";
import type { ContactPayload } from "@/lib/types";

/**
 * Endpoint público de contacto.
 *
 * Flujo:
 *   1. Valida el payload del formulario.
 *   2. Asigna el ingeniero más cercano por proximidad geográfica.
 *   3. Persiste la solicitud en la base de datos (status='nuevo').
 *   4. Registra log de auditoría de la asignación.
 *   5. Envía email de confirmación al cliente (Brevo).
 *   6. Envía email de notificación al ingeniero asignado (Brevo).
 *   7. Envía copia al email central de la compañía (Brevo).
 *   8. Marca emailSent=true y registra logs de envío.
 *
 * ⚠️ Los datos PRIVADOS del ingeniero (teléfono, email, dirección)
 *    NO se incluyen en la respuesta al cliente.
 *
 * Si Brevo falla, la solicitud queda persistida igual (status='nuevo')
 * y podrá ser procesada manualmente o por el Worker futuro.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ContactPayload>;

    // Validación básica
    const required: (keyof ContactPayload)[] = [
      "name",
      "email",
      "phone",
      "address",
      "service",
      "message",
    ];
    for (const f of required) {
      const v = body[f];
      if (!v || typeof v !== "string" || v.trim().length < 3) {
        return NextResponse.json(
          { error: `Campo requerido: ${f}` },
          { status: 400 }
        );
      }
    }

    // Normalizar valores
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

    // 2. Persistir en base de datos
    const record = await db.contactRequest.create({
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        lat: payload.lat ?? null,
        lng: payload.lng ?? null,
        service: payload.service,
        message: payload.message,
        preferredChannel: payload.preferredChannel,
        assignedEngineerId: assignment.engineerId,
        assignedZone: assignment.zone,
        status: "nuevo",
      },
    });

    // 3. Log de auditoría
    await db.automationLog.create({
      data: {
        requestId: record.id,
        action: "assigned",
        detail: `Ingeniero ${assignment.engineerId} asignado (${assignment.zone}${
          assignment.distanceKm ? `, ${assignment.distanceKm}km` : ""
        })`,
        success: true,
      },
    });

    // 4. Envío de emails vía Brevo (no bloqueante para el cliente)
    //    Si fallan, la solicitud queda igual persistida.
    const brevoStatus = getBrevoConfigStatus();
    const emailSummary = {
      clientEmailSent: false,
      engineerEmailSent: false,
      centralEmailSent: false,
      brevoConfigured: brevoStatus.hasApiKey,
    };

    if (brevoStatus.hasApiKey) {
      const serviceLabel =
        SERVICES.find((s) => s.id === payload.service)?.title ?? payload.service;

      // 4a. Email al cliente
      const whatsappLink = brevoStatus.whatsappPublic
        ? `https://wa.me/${brevoStatus.whatsappPublic.replace(/[^0-9]/g, "")}`
        : undefined;

      const clientEmail = buildClientConfirmationEmail({
        name: payload.name,
        service: serviceLabel,
        zone: assignment.zone,
        whatsappLink,
      });

      const clientResult = await sendEmail({
        to: [{ email: payload.email, name: payload.name }],
        subject: clientEmail.subject,
        html: clientEmail.html,
        text: clientEmail.text,
        tags: ["contacto-cliente", payload.service],
      });
      emailSummary.clientEmailSent = clientResult.success;

      await db.automationLog.create({
        data: {
          requestId: record.id,
          action: "email_sent",
          detail: `Email de confirmación al cliente (${payload.email})`,
          success: clientResult.success,
        },
      });

      // 4b. Email al ingeniero asignado (datos privados del servidor)
      const engineer = ENGINEERS_PRIVATE.find(
        (e) => e.id === assignment.engineerId
      );

      if (engineer) {
        const engEmail = buildEngineerNotificationEmail({
          engineerName: `Ingeniero ${engineer.id.toUpperCase()}`,
          engineerEmail: engineer.email,
          client: payload,
          zone: assignment.zone,
          requestId: record.id,
          distanceKm: assignment.distanceKm,
        });

        const engResult = await sendEmail({
          to: [{ email: engineer.email }],
          subject: engEmail.subject,
          html: engEmail.html,
          text: engEmail.text,
          tags: ["notificacion-interna", `ing-${engineer.id}`],
        });
        emailSummary.engineerEmailSent = engResult.success;

        await db.automationLog.create({
          data: {
            requestId: record.id,
            action: "email_sent",
            detail: `Notificación interna al ingeniero (${engineer.email})`,
            success: engResult.success,
          },
        });

        // 4c. Copia al email central de la compañía
        if (brevoStatus.notifyEmail && brevoStatus.notifyEmail !== engineer.email) {
          const centralResult = await sendEmail({
            to: [{ email: brevoStatus.notifyEmail, name: COMPANY.name }],
            subject: `[COPIA] ${engEmail.subject}`,
            html: engEmail.html,
            text: engEmail.text,
            tags: ["copia-central", `ing-${engineer.id}`],
          });
          emailSummary.centralEmailSent = centralResult.success;

          await db.automationLog.create({
            data: {
              requestId: record.id,
              action: "email_sent",
              detail: `Copia al email central (${brevoStatus.notifyEmail})`,
              success: centralResult.success,
            },
          });
        }
      }

      // 5. Actualizar estado de la solicitud
      const allSent =
        emailSummary.clientEmailSent &&
        emailSummary.engineerEmailSent;
      await db.contactRequest.update({
        where: { id: record.id },
        data: {
          status: allSent ? "notificado" : "nuevo",
          emailSent: allSent,
        },
      });
    } else {
      // Brevo no configurado — registrar log para diagnóstico
      await db.automationLog.create({
        data: {
          requestId: record.id,
          action: "email_skipped",
          detail:
            "BREVO_API_KEY no configurada. Solicitud persistida pero sin envío de email.",
          success: false,
        },
      });
    }

    // 6. Respuesta al cliente — NO incluye datos privados del ingeniero
    return NextResponse.json({
      ok: true,
      requestId: record.id,
      assignedZone: assignment.zone,
      emailsSent: emailSummary,
      message:
        "Solicitud recibida. Te contactaremos en menos de 24 horas hábiles por el canal indicado.",
    });
  } catch (err) {
    console.error("[/api/contact] error:", err);
    return NextResponse.json(
      { error: "Error interno. Intenta nuevamente." },
      { status: 500 }
    );
  }
}

/**
 * GET — listado de solicitudes (uso interno / futuro dashboard).
 * En producción debe protegerse con autenticación.
 */
export async function GET() {
  try {
    const requests = await db.contactRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        service: true,
        assignedZone: true,
        status: true,
        emailSent: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ requests });
  } catch (err) {
    console.error("[/api/contact GET] error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
