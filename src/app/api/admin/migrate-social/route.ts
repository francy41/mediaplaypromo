import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function authed(req: NextRequest) {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

/**
 * POST /api/admin/migrate-social  (protegido, solo admin)
 * Crea las tablas social_autoresponder y social_reply_log si no existen.
 * Llámalo una vez después del deploy.
 */
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const results: Record<string, string> = {};

  // Intenta insertar la fila singleton (detecta si la tabla existe)
  const { error: checkErr } = await admin
    .from("social_autoresponder")
    .select("id")
    .eq("id", "singleton")
    .maybeSingle();

  if (!checkErr) {
    results.social_autoresponder = "✅ ya existe";
  } else {
    results.social_autoresponder = `❌ tabla no existe: ${checkErr.message}`;
  }

  const { error: logCheckErr } = await admin
    .from("social_reply_log")
    .select("id")
    .limit(1);

  if (!logCheckErr) {
    results.social_reply_log = "✅ ya existe";
  } else {
    results.social_reply_log = `❌ tabla no existe: ${logCheckErr.message}`;
  }

  const sqlToCopy = `
-- Pega esto en Supabase Dashboard > SQL Editor
create table if not exists public.social_autoresponder (
  id text primary key default 'singleton',
  enabled boolean not null default true,
  trigger_mode text not null default 'any',
  keywords text[] not null default '{}',
  message_template text not null default '',
  link_type text not null default 'product',
  custom_link text,
  product_slug text default 'yf-auto-clip-v1',
  updated_at timestamptz not null default now()
);
create table if not exists public.social_reply_log (
  id uuid primary key default gen_random_uuid(),
  contact_name text,
  contact_id text,
  platform text,
  incoming_message text,
  reply_sent text,
  status text not null default 'sent',
  error text,
  conversation_id text,
  created_at timestamptz not null default now()
);
alter table public.social_autoresponder enable row level security;
alter table public.social_reply_log enable row level security;
`.trim();

  return NextResponse.json({ results, sqlToCopy });
}
