import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/lib/integrations";
import { searchWikimediaCommons } from "@/lib/media-sources";
import { resolveOwner } from "@/lib/planner-admins";

export const runtime = "nodejs";

/** SuperAdmin o admin del Planificador (token válido). */
async function authed(req: NextRequest): Promise<boolean> {
  return !!(await resolveOwner(req.headers.get("x-admin-secret")));
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
  if (!(await authed(req))) return NextResponse.json({ error: "No autorizado", results: [] }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const srcParam = searchParams.get("source") || "";
  const source = ["archive", "wikimedia", "pixabay", "coverr"].includes(srcParam) ? srcParam : "pexels";
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

  /* ── Wikimedia Commons — videos libres con URL directa reproducible ── */
  if (source === "wikimedia") {
    try {
      const items = await searchWikimediaCommons(q, 24);
      const results = items
        .filter((it) => it.videoUrl && it.thumbnail)
        .map((it) => ({ id: it.id, type: "video" as const, thumb: it.thumbnail as string, url: it.videoUrl as string, title: it.title, author: "Wikimedia Commons" }));
      return NextResponse.json({ results, page });
    } catch (e) {
      return NextResponse.json({ results: [], error: e instanceof Error ? e.message : "Error Wikimedia" });
    }
  }

  /* ── Coverr — videos cinematográficos gratis (uso comercial, sin atribución) ── */
  if (source === "coverr") {
    const cv = await getIntegration("coverr");
    if (!cv?.apiKey) return NextResponse.json({ results: [], error: "Conecta tu clave de Coverr en Integraciones / APIs (proveedor: coverr)." });
    const cbase = (cv.baseUrl || "https://api.coverr.co").replace(/\/+$/, "");
    try {
      const sr = await fetch(`${cbase}/videos?query=${encodeURIComponent(q)}&page_size=12&page=${Math.max(0, page - 1)}&api_key=${cv.apiKey}`, { cache: "no-store" });
      const sd = await sr.json().catch(() => ({} as Record<string, unknown>)) as { hits?: Array<{ id?: string; poster?: string; thumbnail?: string }> };
      if (!sr.ok) return NextResponse.json({ results: [], error: `Coverr error ${sr.status}` });
      const hits = (sd.hits || []).filter((h) => h.id).slice(0, 12);
      const details = await Promise.all(hits.map(async (h) => {
        try {
          const dr = await fetch(`${cbase}/videos/${h.id}?api_key=${cv.apiKey}`, { cache: "no-store" });
          const dd = await dr.json().catch(() => ({} as Record<string, unknown>)) as { urls?: { mp4?: string; mp4_preview?: string }; poster?: string; thumbnail?: string; duration?: number; max_width?: number; max_height?: number };
          const url = dd.urls?.mp4 || dd.urls?.mp4_preview;
          if (!url) return null;
          return { id: String(h.id), type: "video", thumb: dd.thumbnail || dd.poster || h.thumbnail || h.poster || "", url, duration: dd.duration, width: dd.max_width, height: dd.max_height, author: "Coverr" } as StockItem;
        } catch { return null; }
      }));
      const results = details.filter(Boolean) as StockItem[];
      return NextResponse.json({ results, page });
    } catch (e) {
      return NextResponse.json({ results: [], error: e instanceof Error ? e.message : "Error de red" });
    }
  }

  /* ── Pixabay — fotos / videos gratis (licencia libre, sin atribución) ── */
  if (source === "pixabay") {
    const px = await getIntegration("pixabay");
    if (!px?.apiKey) return NextResponse.json({ results: [], error: "Conecta tu clave de Pixabay en Integraciones / APIs (proveedor: pixabay)." });
    const pbase = (px.baseUrl || "https://pixabay.com/api").replace(/\/+$/, "");
    const ori = searchParams.get("orientation");
    try {
      if (type === "video") {
        const url = `${pbase}/videos/?key=${px.apiKey}&q=${encodeURIComponent(q)}&per_page=24&page=${page}`;
        const r = await fetch(url, { cache: "no-store" });
        const d = await r.json().catch(() => ({} as Record<string, unknown>)) as { hits?: unknown[]; total?: number };
        if (!r.ok) return NextResponse.json({ results: [], error: `Pixabay error ${r.status}` });
        type Sz = { url?: string; width?: number; height?: number; thumbnail?: string };
        type PV = { id: number; duration?: number; user?: string; videos?: Record<string, Sz> };
        const results: StockItem[] = ((d.hits as PV[]) || []).map((v) => {
          const f = v.videos || {};
          const pick = f.large || f.medium || f.small || f.tiny || {};
          const thumb = f.large?.thumbnail || f.medium?.thumbnail || f.small?.thumbnail || f.tiny?.thumbnail || "";
          return { id: v.id, type: "video", thumb, url: pick.url || "", author: v.user, duration: v.duration, width: pick.width, height: pick.height };
        });
        return NextResponse.json({ results, page, total: d.total ?? null });
      }
      const oriParam = ori === "portrait" ? "&orientation=vertical" : ori === "landscape" ? "&orientation=horizontal" : "";
      const url = `${pbase}/?key=${px.apiKey}&q=${encodeURIComponent(q)}&image_type=photo&per_page=24&page=${page}${oriParam}`;
      const r = await fetch(url, { cache: "no-store" });
      const d = await r.json().catch(() => ({} as Record<string, unknown>)) as { hits?: unknown[]; total?: number };
      if (!r.ok) return NextResponse.json({ results: [], error: `Pixabay error ${r.status}` });
      type PP = { id: number; webformatURL?: string; largeImageURL?: string; previewURL?: string; imageWidth?: number; imageHeight?: number; user?: string };
      const results: StockItem[] = ((d.hits as PP[]) || []).map((p) => ({
        id: p.id, type: "photo", thumb: p.webformatURL || p.previewURL || "", url: p.largeImageURL || p.webformatURL || "", author: p.user, width: p.imageWidth, height: p.imageHeight,
      }));
      return NextResponse.json({ results, page, total: d.total ?? null });
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
