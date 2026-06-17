import "server-only";

const API = "https://services.leadconnectorhq.com";

/**
 * Envía un DM en GHL. La API de Conversations envía por `contactId` (crea/encuentra
 * la conversación del canal). Pasamos también conversationId si lo tenemos.
 * Esto hace que funcione tanto para DMs como para comentarios (donde aún no hay conversación).
 */
export async function sendConversationReply(
  params: { contactId?: string; conversationId?: string; message: string; type?: "IG" | "FB" | "SMS" | "WhatsApp" | "Custom" }
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const token = process.env.GHL_API_TOKEN;
  if (!token) return { ok: false, error: "GHL_API_TOKEN no configurado" };

  const { contactId, conversationId, message, type = "IG" } = params;
  if (!contactId && !conversationId) return { ok: false, error: "Falta contactId/conversationId" };

  const payload: Record<string, unknown> = { type, message };
  if (contactId) payload.contactId = contactId;
  if (conversationId) payload.conversationId = conversationId;

  try {
    const res = await fetch(`${API}/conversations/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const m = data?.message ?? data?.error;
      return { ok: false, error: typeof m === "string" ? m : (JSON.stringify(data).slice(0, 200) || "Error al enviar mensaje") };
    }
    return { ok: true, messageId: data?.id ?? data?.messageId ?? data?.message?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

/** Mapea messageType de GHL al type de la API de Conversations */
export function ghlMessageTypeToConvType(messageType: string): "IG" | "FB" | "SMS" | "WhatsApp" | "Custom" {
  const t = (messageType ?? "").toUpperCase();
  if (t === "IG" || t === "INSTAGRAM") return "IG";
  if (t === "FB" || t === "FACEBOOK") return "FB";
  if (t === "SMS") return "SMS";
  if (t === "WHATSAPP") return "WhatsApp";
  return "Custom";
}

/** Renderiza un template con variables {nombre}, {link_compra}, etc. */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}
