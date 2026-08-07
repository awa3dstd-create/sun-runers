import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assignNearestEngineer } from "@/lib/engineer-assignment";
import type { ContactPayload } from "@/lib/types";

/**
 * Endpoint público de contacto.
 *
 * Recibe la solicitud del formulario, la persiste en la base de datos
 * y le asigna el ingeniero más cercano usando el algoritmo de
 * proximidad (provincias de Cuba).
 *
 * ⚠️ Los datos PRIVADOS del ingeniero (teléfono, email, dirección)
 *    NO se incluyen en la respuesta. El cliente solo recibe confirmación
 *    de que su solicitud fue recibida y la zona de cobertura asignada.
 *
 * La automatización futura (Cloudflare Worker + WhatsApp Business API)
 * consumirá la tabla ContactRequest donde status='nuevo' y ejecutará
 * las notificaciones al ingeniero asignado.
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

    // Asignación de ingeniero por proximidad
    const assignment = assignNearestEngineer(
      body.address!,
      body.lat,
      body.lng
    );

    // Persistir en base de datos
    const record = await db.contactRequest.create({
      data: {
        name: body.name!.trim(),
        email: body.email!.trim(),
        phone: body.phone!.trim(),
        address: body.address!.trim(),
        lat: body.lat ?? null,
        lng: body.lng ?? null,
        service: body.service!,
        message: body.message!.trim(),
        preferredChannel: body.preferredChannel ?? "whatsapp",
        assignedEngineerId: assignment.engineerId,
        assignedZone: assignment.zone,
        status: "nuevo",
      },
    });

    // Log de auditoría
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

    // Respuesta al cliente — NO incluye datos privados del ingeniero
    return NextResponse.json({
      ok: true,
      requestId: record.id,
      assignedZone: assignment.zone,
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
 * GET — listado de solicitudes (solo para uso interno / futuro dashboard).
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
        createdAt: true,
      },
    });
    return NextResponse.json({ requests });
  } catch (err) {
    console.error("[/api/contact GET] error:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
