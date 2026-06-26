import { NextRequest, NextResponse } from "next/server";
import { searchMedia, resolveArchiveVideo } from "@/lib/media-sources";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/media/search?q=...&source=archive|wikimedia|all&limit=20
 * Busca videos en fuentes gratis (Internet Archive + Wikimedia Commons).
 *
 * GET /api/media/search?resolve=<archiveIdentifier>
 * Resuelve la URL de video reproducible de un item de Internet Archive.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const resolve = sp.get("resolve");
  if (resolve) {
    const videoUrl = await resolveArchiveVideo(resolve);
    return NextResponse.json({ ok: !!videoUrl, videoUrl });
  }

  const q = (sp.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ ok: false, error: "Falta la búsqueda (q).", items: [] }, { status: 400 });
  const source = (sp.get("source") ?? "all") as "archive" | "wikimedia" | "all";
  const limit = Math.min(40, Math.max(1, Number(sp.get("limit") ?? 20) || 20));

  try {
    const items = await searchMedia(q, source, limit);
    return NextResponse.json({ ok: true, count: items.length, items });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error", items: [] }, { status: 500 });
  }
}
