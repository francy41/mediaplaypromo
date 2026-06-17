import "server-only";

const API = "https://services.leadconnectorhq.com";

/** Envía un mensaje de respuesta a una conversación de GHL (DM de Instagram, Facebook, etc.) */
export async function sendConversationReply(
  conversationId: string,
  message: string,
  type: "IG" | "FB" | "SMS" | "WhatsApp" | "Custom" = "IG"
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const token = process.env.GHL_API_TOKEN;
  if (!token) return { ok: false, error: "GHL_API_TOKEN no configurado" };

  try {
    const res = await fetch(`${API}/conversations/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, conversationId, message }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.message ?? "Error al enviar mensaje" };
    return { ok: true, messageId: data?.id ?? data?.message?.id };
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
