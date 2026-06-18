import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { listAffiliatesWithStats } from "@/lib/affiliate";

export const runtime = "nodejs";

function authed(req: NextRequest): boolean {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

/** GET /api/affiliates — lista afiliados con ventas y comisiones. */
export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const affiliates = await listAffiliatesWithStats();
    return NextResponse.json({ affiliates });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error", affiliates: [] }, { status: 500 });
  }
}

/** POST /api/affiliates — crear/editar afiliado o borrar. */
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const admin = createSupabaseAdminClient();

  if (body.action === "delete") {
    const { error } = await admin.from("affiliates").delete().eq("code", body.code);
    return NextResponse.json({ ok: !error, error: error?.message });
  }

  // Crear / actualizar
  const code = String(body.code ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!code) return NextResponse.json({ error: "Código inválido (solo letras, números, - y _)" }, { status: 400 });

  let rate = Number(body.commission_rate);
  if (!Number.isFinite(rate)) rate = 0.4;
  if (rate > 1) rate = rate / 100; // permite 40 → 0.40
  rate = Math.min(1, Math.max(0, rate));

  const row = {
    code,
    name: body.name ? String(body.name).trim() : null,
    email: body.email ? String(body.email).trim() : null,
    commission_rate: rate,
  };
  const { error } = await admin.from("affiliates").upsert(row, { onConflict: "code" });
  return NextResponse.json({ ok: !error, code, error: error?.message });
}
