import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/keepalive
 * Hace una consulta mínima a Supabase para registrar actividad y evitar que
 * el proyecto (plan free) se pause por inactividad (~7 días).
 * Lo dispara un cron diario de Vercel (ver vercel.json).
 */
export async function GET() {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("profiles").select("id").limit(1);
    return NextResponse.json({ ok: !error, db: error ? "error" : "active", ts: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" });
  }
}
