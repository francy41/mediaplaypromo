import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function authed(req: NextRequest) {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

const DEFAULT_TEMPLATE = `👋 ¡Hola {nombre}!

Gracias por escribir ✌️

Te cuento sobre YF Auto Clip — la herramienta que permite procesar 100+ videos en menos de 1 hora 🎬⚡

✅ Lo que hace por ti:
• Audio replace masivo en segundos
• Corte automático de clips al segundo exacto
• Conversión de formatos (MP4, MOV, WebM y más)
• 100% local — tus videos no se suben a ningún servidor

Sin suscripciones. Sin experiencia previa. Sin complicaciones.

+2,800 creadores en Latinoamérica ya lo usan 🔥

🔥 Descuento especial con el código YFAUTOCLIP

👉 Consíguelo aquí: {link_compra}

¿Tienes alguna duda? Escríbeme y te ayudo 😊`;

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("social_autoresponder").select("*").eq("id", "singleton").maybeSingle();
  return NextResponse.json({
    config: data ?? {
      id: "singleton",
      enabled: false,
      trigger_mode: "any",
      keywords: [],
      message_template: DEFAULT_TEMPLATE,
      link_type: "product",
      custom_link: "",
      product_slug: "yf-auto-clip-v1",
    },
    defaultTemplate: DEFAULT_TEMPLATE,
  });
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const admin = createSupabaseAdminClient();

  const row = {
    id: "singleton",
    enabled: !!body.enabled,
    trigger_mode: body.trigger_mode ?? "any",
    keywords: Array.isArray(body.keywords) ? body.keywords : [],
    message_template: body.message_template ?? DEFAULT_TEMPLATE,
    link_type: body.link_type ?? "product",
    custom_link: body.custom_link ?? null,
    product_slug: body.product_slug ?? "yf-auto-clip-v1",
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from("social_autoresponder").upsert(row, { onConflict: "id" });
  return NextResponse.json({ ok: !error, error: error?.message });
}

export async function GET_LOGS(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("social_reply_log").select("*").order("created_at", { ascending: false }).limit(100);
  return NextResponse.json({ logs: data ?? [] });
}
