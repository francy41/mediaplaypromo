import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function authed(req: NextRequest) {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("social_reply_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return NextResponse.json({ logs: data ?? [] });
}
