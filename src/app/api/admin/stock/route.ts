import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/lib/integrations";

export const runtime = "nodejs";

/** Solo SuperAdmin: requiere el secreto de administrador. */
function authed(req: NextRequest): boolean {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

interface StockItem {
  id: string | number;
  type: "photo" | "video" | "archive";
  thumb: string;
  url: string;
  embed?: string;
  title?: string;
  year?: number | string;
  author?: string;
  duration?: number;
  width?: number;
  height?: number;
}

const first = <T,>(v: T | T[]): T => (Array.isArray(v) ? v[0] : v);

/**
 * GET /api/admin/stock?q=...&source=pexels|archive&type=photo|video&page=1
 * Banco de Medios (solo SuperAdmin):
 *  - source=pexels  → fotos/videos de stock (requiere clave Pexels)
 *  - source=archive → películas/documentales de Internet Archive (dominio público, sin clave)
 */
export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado", results: [] }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const source = searchParams.get("source") === "archive" ? "archive" : "pexels";
  const type = searchParams.get("type") === "video" ? "video" : "photo";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  if (!q) return NextResponse.json({ results: [], page });

  /* ── Internet Archive — películas, documentales, noticias, entrevistas, audio… ── */
  if (source === "archive") {
    const media = searchParams.get("media"); // "video" | "audio" | "all"
    const mt = media === "audio" ? " AND mediatype:(audio)" : media === "all" ? "" : " AND mediatype:(movies)";
    const aq = encodeURIComponent(`(${q})${mt}`);
    const url = `https://archive.org/advancedsearch.php?q=${aq}&fl[]=identifier&fl[]=title&fl[]=year&fl[]=mediatype&fl[]=description&rows=24&page=${page}&output=json&sort[]=downloads%20desc`;
    try {
      const r = await fetch(url, { cache: "no-store" });
      const d = await r.json().catch(() => ({} as Record<string, unknown>)) as { response?: { docs?: Array<Record<string, unknown>> } };
      const docs = d.response?.docs ?? [];
      const results: StockItem[] = docs.map((doc) => {
        const id = String(doc.identifier);
        return {
          id,
          type: "archive",
          title: first(doc.title as string | string[]) || id,
          year: first(doc.year as string | string[] | number),
          thumb: `https://archive.org/services/img/${id}`,
          url: `https://archive.org/details/${id}`,
          embed: `https://archive.org/embed/${id}`,
        };
      });
      return NextResponse.json({ results, page });
    } catch (e) {
      return NextResponse.json({ results: [], error: e instanceof Error ? e.message : "Error de red" });
    }
  }

  /* ── Pexels — fotos / videos de stock ── */
  const integ = await getIntegration("pexels");
  if (!integ?.apiKey) {
    return NextResponse.json({ results: [], error: "Conecta tu clave de Pexels en Integraciones / APIs (proveedor: pexels)." });
  }

  const ori = searchParams.get("orientation");
  const oriParam = ori === "portrait" || ori === "landscape" || ori === "square" ? `&orientation=${ori}` : "";
  const base = "https://api.pexels.com";
  const url =
    type === "video"
      ? `${base}/videos/search?query=${encodeURIComponent(q)}&per_page=24&page=${page}${oriParam}`
      : `${base}/v1/search?query=${encodeURIComponent(q)}&per_page=24&page=${page}${oriParam}`;

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
