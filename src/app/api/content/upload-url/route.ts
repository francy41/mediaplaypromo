import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const BUCKET = "content-videos";

function authed(req: NextRequest): boolean {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

/**
 * POST /api/content/upload-url   Header: x-admin-secret
 * Devuelve una URL firmada para subir un video directo a Supabase Storage
 * (evita el límite de tamaño del servidor). Body: { filename }
 */
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { filename } = await req.json().catch(() => ({}));
  if (!filename) return NextResponse.json({ error: "Falta filename" }, { status: 400 });

  const safe = String(filename).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${Date.now()}-${safe}`;

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "No se pudo crear la URL de subida" }, { status: 500 });
    }
    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ path: data.path, token: data.token, publicUrl: pub.publicUrl });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
