import { NextRequest, NextResponse } from "next/server";
import { isAdmin, liveServiceClient, LIVE_BUCKET } from "@/lib/live-channel";

export const dynamic = "force-dynamic";

/**
 * POST /api/live/upload  → ADMIN (header x-admin-secret)
 * Crea una URL firmada de subida para que el navegador suba el mp4
 * DIRECTO a Supabase Storage (evita el límite de body de Vercel).
 * Body: { filename: string }
 * Devuelve: { path, token, publicUrl }
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const filename: string = String(body.filename ?? "video.mp4");

  // Nombre seguro + único.
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;

  const db = liveServiceClient();
  const { data, error } = await db.storage.from(LIVE_BUCKET).createSignedUploadUrl(path);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: pub } = db.storage.from(LIVE_BUCKET).getPublicUrl(path);

  return NextResponse.json({
    path: data.path,
    token: data.token,
    publicUrl: pub.publicUrl,
  });
}
