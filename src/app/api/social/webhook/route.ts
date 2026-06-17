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

  // Procesamos mensajes entrantes (DM) y comentarios
  const eventType = (body.type ?? body.event ?? "") as string;
  const et = eventType.toLowerCase();
  const isComment = et.includes("comment");
  const isMessage = et.includes("inbound") || et.includes("message");
  if (!isComment && !isMessage) {
    return NextResponse.json({ ok: true, skipped: `evento no manejado: ${eventType}` });
  }

  const conversationId = (body.conversationId ?? body.conversation_id ?? "") as string;
  const contactId = (body.contactId ?? body.contact_id ?? "") as string;
  const messageType = (body.messageType ?? body.message_type ?? "IG") as string;
  // El texto puede venir en distintos campos según sea DM o comentario
  const incomingMessage = ((body.message ?? body.body ?? body.comment ?? body.commentText ?? body.text ?? "") as string).trim();
  const firstName = (body.firstName ?? body.first_name ?? body.fullName ?? "amigo") as string;
  const contactName = (body.fullName ?? body.full_name ?? firstName) as string;
  const locationId = body.locationId as string | undefined;

  // Ignorar mensajes propios (outbound) si GHL los incluye
  const direction = (body.direction ?? "") as string;
  if (direction.toLowerCase() === "outbound") return NextResponse.json({ ok: true, skipped: true });

  if (!conversationId) return NextResponse.json({ ok: true, skipped: "no conversationId" });

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

  // Verificar trigger.
  // - DM: respeta trigger_mode (any = responde a todos; keyword = solo si coincide).
  // - Comentario: SIEMPRE exige palabra clave, para no enviar DM a todo el que comente algo.
  const keywords: string[] = Array.isArray(config.keywords) ? config.keywords : [];
  const requireKeyword = isComment || config.trigger_mode === "keyword";
  if (requireKeyword) {
    const kws = keywords.length > 0 ? keywords : (isComment ? ["clip"] : []);
    if (kws.length > 0) {
      const msg = incomingMessage.toLowerCase();
      const matched = kws.some((kw: string) => msg.includes(kw.toLowerCase()));
      if (!matched) return NextResponse.json({ ok: true, skipped: "no keyword match" });
    }
  }

  // Evitar duplicados: si ya respondimos a esta conversación en los últimos 60 min, no volver a responder
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recent } = await admin
    .from("social_reply_log")
    .select("id")
    .eq("conversation_id", conversationId)
    .gte("created_at", oneHourAgo)
    .limit(1);
  if (recent && recent.length > 0) {
    return NextResponse.json({ ok: true, skipped: "already replied recently" });
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

  // Enviar respuesta
  const convType = ghlMessageTypeToConvType(messageType);
  const result = await sendConversationReply(conversationId, renderedMessage, convType);

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
