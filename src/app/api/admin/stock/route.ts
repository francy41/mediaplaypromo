import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/lib/integrations";

export const runtime = "nodejs";

/** Solo SuperAdmin: requiere el secreto de administrador. */
function authed(req: NextRequest): boolean {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

interface StockItem {
  id: number;
  type: "photo" | "video";
  thumb: string;
  url: string;
  author?: string;
  duration?: number;
  width?: number;
  height?: number;
}

/**
 * GET /api/admin/stock?q=...&type=photo|video&page=1
 * Banco de medios: busca fotos/videos reales en Pexels (gratis, con licencia).
 * La clave de Pexels se lee del servidor (Integraciones, provider "pexels").
 */
export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado", results: [] }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const type = searchParams.get("type") === "video" ? "video" : "photo";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  if (!q) return NextResponse.json({ results: [], page });

  const integ = await getIntegration("pexels");
  if (!integ?.apiKey) {
    return NextResponse.json({ results: [], error: "Conecta tu clave de Pexels en Integraciones / APIs (proveedor: pexels)." });
  }

  const base = "https://api.pexels.com";
  const url =
    type === "video"
      ? `${base}/videos/search?query=${encodeURIComponent(q)}&per_page=24&page=${page}`
      : `${base}/v1/search?query=${encodeURIComponent(q)}&per_page=24&page=${page}`;

  try {
    const r = await fetch(url, { headers: { Authorization: integ.apiKey }, cache: "no-store" });
    const d = await r.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>;
    if (!r.ok) return NextResponse.json({ results: [], error: (d.error as string) || `Pexels error ${r.status}` });

    let results: StockItem[] = [];
    if (type === "video") {
      type Vid = { id: number; image: string; duration: number; user?: { name?: string }; video_files?: Array<{ link: string; width?: number; height?: number }> };
      results = ((d.videos as Vid[]) || []).map((v) => {
        const files = (v.video_files || []).slice().sort((a, b) => (a.width || 0) - (b.width || 0));
        const pick = files.find((f) => (f.width || 0) >= 1024) || files[files.length - 1] || ({} as { link?: string; width?: number; height?: number });
        return { id: v.id, type: "video", thumb: v.image, url: pick.link || "", author: v.user?.name, duration: v.duration, width: pick.width, height: pick.height };
      });
    } else {
      type Pho = { id: number; src?: Record<string, string>; photographer?: string; width?: number; height?: number };
      results = ((d.photos as Pho[]) || []).map((p) => ({
        id: p.id, type: "photo", thumb: p.src?.medium || p.src?.tiny || "", url: p.src?.original || p.src?.large2x || "", author: p.photographer, width: p.width, height: p.height,
      }));
    }
    return NextResponse.json({ results, page, total: (d.total_results as number) ?? null });
  } catch (e) {
    return NextResponse.json({ results: [], error: e instanceof Error ? e.message : "Error de red" });
  }
}
