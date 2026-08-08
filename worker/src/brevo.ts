// Brevo API client — Cloudflare Worker version (native fetch)

import type { Env } from "./index";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailParams {
  to: EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: EmailRecipient;
  tags?: string[];
}

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendEmail(
  env: Env,
  params: SendEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!env.BREVO_API_KEY) {
    return { success: false, error: "BREVO_API_KEY no configurada" };
  }
  if (!env.BREVO_FROM_EMAIL) {
    return { success: false, error: "BREVO_FROM_EMAIL no configurada" };
  }

  try {
    const body: Record<string, unknown> = {
      sender: { email: env.BREVO_FROM_EMAIL, name: env.BREVO_FROM_NAME || "SUN-RUNNERS" },
      to: params.to,
      subject: params.subject,
      htmlContent: params.html,
      replyTo: params.replyTo ?? { email: env.BREVO_FROM_EMAIL, name: env.BREVO_FROM_NAME || "SUN-RUNNERS" },
    };

    if (params.text) body.textContent = params.text;
    if (params.tags?.length) body.tags = params.tags;

    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": env.BREVO_API_KEY,
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
