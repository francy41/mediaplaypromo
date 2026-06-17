import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendConversationReply, ghlMessageTypeToConvType, renderTemplate } from "@/lib/ghl-conversations";

export const maxDuration = 30;

function buildProductLink(config: {
  link_type: string;
  custom_link?: string | null;
  product_slug?: string | null;
}): string {
  if (config.link_type === "custom" && config.custom_link) return config.custom_link;
  if (config.link_type === "community") return "https://mediaplaypromo.com/community";
  const rawSlug = config.product_slug ?? "yf-auto-clip-v1";
  const slug = rawSlug === "yfautoclip-v2" ? "yf-auto-clip-v1" : rawSlug;
  return `https://mediaplaypromo.com/categories/editor-video/${slug}`;
}

/**
 * POST /api/social/webhook
 * Receptor de webhooks de GoHighLevel.
 * Configura en GHL → Settings → Webhooks → InboundMessage
 * URL: https://mediaplaypromo.com/api/social/webhook?secret=TU_SECRET
 */
export async function POST(req: NextRequest) {
  // Verificación básica via query param secret
  const webhookSecret = process.env.GHL_WEBHOOK_SECRET;
  if (webhookSecret) {
    const qs = req.nextUrl.searchParams.get("secret");
    if (qs !== webhookSecret) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return NextResponse.json({ ok: true }); }

  // DEBUG TEMPORAL: capturar el payload crudo que envía GHL para diagnóstico.
  try {
    await createSupabaseAdminClient().from("social_reply_log").insert({
      platform: "DEBUG",
      incoming_message: JSON.stringify(body).slice(0, 2000),
      reply_sent: req.nextUrl.search.slice(0, 200),
      status: "debug",
    });
  } catch { /* noop */ }

  // GHL (workflow webhook) envía los datos del disparador en `triggerData`.
  // Ej comentario IG: triggerData.igCommentOnPost.ig.body = "texto del comentario".
  const eventType = (body.type ?? body.event ?? "") as string;
  const et = eventType.toLowerCase();

  const triggerData = (body.triggerData ?? {}) as Record<string, unknown>;
  const triggerKey = Object.keys(triggerData)[0] ?? "";
  const tk = triggerKey.toLowerCase();
  const triggerObj = (triggerData[triggerKey] ?? {}) as Record<string, unknown>;
  const platObj = ((triggerObj.ig ?? triggerObj.instagram ?? triggerObj.fb ?? triggerObj.facebook ??
    triggerObj.tiktok ?? triggerObj.tt ?? triggerObj) ?? {}) as Record<string, unknown>;

  const isComment = tk.includes("comment") || et.includes("comment");

  const conversationId = (body.conversationId ?? body.conversation_id ?? "") as string;
  const contactObj = (body.contact ?? {}) as Record<string, unknown>;
  const contactId = (body.contactId ?? body.contact_id ?? contactObj.id ?? "") as string;

  // Texto del comentario/mensaje: busca en triggerData anidado y en campos planos
  const triggerBody = (platObj.body ?? platObj.body_exact_match ?? platObj.message ?? platObj.text ?? "") as string;
  const incomingMessage = String(body.message ?? body.body ?? body.comment ?? body.commentText ?? body.text ?? triggerBody ?? "").trim();

  const firstName = (body.firstName ?? body.first_name ?? body.full_name ?? body.fullName ?? "amigo") as string;
  const contactName = (body.full_name ?? body.fullName ?? firstName) as string;

  // Plataforma para el tipo de mensaje de respuesta
  let messageType = "IG";
  if (triggerObj.fb || triggerObj.facebook || tk.includes("fb") || tk.includes("facebook")) messageType = "FB";
  else if (triggerObj.ig || triggerObj.instagram || tk.includes("ig") || tk.includes("instagram")) messageType = "IG";
  else if (triggerObj.tiktok || triggerObj.tt || tk.includes("tiktok")) messageType = "TikTok";
  else if (body.messageType || body.message_type) messageType = String(body.messageType ?? body.message_type);

  // Ignorar mensajes propios (outbound) si GHL los incluye
  const direction = (body.direction ?? "") as string;
  if (direction.toLowerCase() === "outbound") return NextResponse.json({ ok: true, skipped: true });

  if (!conversationId && !contactId) return NextResponse.json({ ok: true, skipped: "no contactId/conversationId" });

  const admin = createSupabaseAdminClient();

  // Cargar configuración
  const { data: config } = await admin
    .from("social_autoresponder")
    .select("*")
    .eq("id", "singleton")
    .maybeSingle();

  if (!config || !config.enabled) {
    return NextResponse.json({ ok: true, skipped: "autoresponder disabled" });
  }

  // Trigger: responde a CUALQUIER comentario y DM.
  // Solo filtra por palabra clave si el modo es "keyword" explícitamente.
  const keywords: string[] = Array.isArray(config.keywords) ? config.keywords : [];
  if (config.trigger_mode === "keyword" && keywords.length > 0) {
    const msg = incomingMessage.toLowerCase();
    const matched = keywords.some((kw: string) => msg.includes(kw.toLowerCase()));
    if (!matched) return NextResponse.json({ ok: true, skipped: "no keyword match" });
  }

  // Evitar duplicados: si ya respondimos a este contacto en los últimos 60 min, no volver a responder.
  // Para comentarios no hay conversationId, así que deduplicamos por contactId.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dedupColumn = contactId ? "contact_id" : "conversation_id";
  const dedupValue = contactId || conversationId;
  if (dedupValue) {
    const { data: recent } = await admin
      .from("social_reply_log")
      .select("id")
      .eq(dedupColumn, dedupValue)
      .gte("created_at", oneHourAgo)
      .limit(1);
    if (recent && recent.length > 0) {
      return NextResponse.json({ ok: true, skipped: "already replied recently" });
    }
  }

  // Construir mensaje
  const productLink = buildProductLink(config);
  const renderedMessage = renderTemplate(config.message_template, {
    nombre: firstName.split(" ")[0],
    nombre_completo: contactName,
    link_compra: productLink,
    link_comunidad: "https://mediaplaypromo.com/community",
    codigo: "YFAUTOCLIP",
  });

  // Enviar respuesta (por contactId; conversationId si existe)
  const convType = ghlMessageTypeToConvType(messageType);
  const result = await sendConversationReply({ contactId, conversationId, message: renderedMessage, type: convType });

  // Guardar log
  await admin.from("social_reply_log").insert({
    contact_name: contactName,
    contact_id: contactId,
    platform: isComment ? `${messageType} (comentario)` : messageType,
    incoming_message: incomingMessage.slice(0, 500),
    reply_sent: renderedMessage.slice(0, 1000),
    status: result.ok ? "sent" : "failed",
    error: result.error ?? null,
    conversation_id: conversationId,
  });

  return NextResponse.json({ ok: result.ok, error: result.error });
}

// GHL a veces hace GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ ok: true, service: "MediaPlayPromo Social Webhook" });
}
