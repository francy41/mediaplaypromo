import "server-only";

/**
 * Conectores de fuentes de medios gratis (sin API key):
 * - Internet Archive (archive.org) — videos de dominio público / históricos
 * - Wikimedia Commons — videos libres con URL directa reproducible
 * Devuelven un formato común (MediaItem) para que el Banco de Medios los consuma.
 */

export interface MediaItem {
  source: "archive" | "wikimedia";
  id: string;
  title: string;
  thumbnail: string | null;
  /** URL de video reproducible/descargable directa (null si hay que resolverla). */
  videoUrl: string | null;
  detailsUrl: string;
  mime?: string;
  year?: string;
}

async function fetchJson(url: string, ms = 12_000): Promise<Record<string, unknown>> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store", headers: { "User-Agent": "MediaPlayPromo/1.0" } });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  } finally {
    clearTimeout(t);
  }
}

/** Busca videos en Internet Archive (mediatype:movies). */
export async function searchInternetArchive(query: string, limit = 20): Promise<MediaItem[]> {
  const q = encodeURIComponent(`${query} AND mediatype:movies`);
  const url = `https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier&fl[]=title&fl[]=year&rows=${limit}&page=1&output=json`;
  const data = await fetchJson(url);
  const docs = ((data.response as Record<string, unknown> | undefined)?.docs as Array<Record<string, unknown>>) ?? [];
  return docs.map((d) => {
    const id = String(d.identifier ?? "");
    return {
      source: "archive" as const,
      id,
      title: String(d.title ?? id),
      thumbnail: id ? `https://archive.org/services/img/${id}` : null,
      videoUrl: null, // se resuelve con resolveArchiveVideo(id)
      detailsUrl: `https://archive.org/details/${id}`,
      year: d.year != null ? String(d.year) : undefined,
    };
  }).filter((x) => x.id);
}

/** Resuelve el archivo de video reproducible de un item de Internet Archive. */
export async function resolveArchiveVideo(identifier: string): Promise<string | null> {
  const data = await fetchJson(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
  const files = (data.files as Array<Record<string, unknown>>) ?? [];
  const video = files.find((f) => /\.(mp4|webm|ogv|m4v|mov)$/i.test(String(f.name ?? "")));
  if (!video) return null;
  return `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(String(video.name))}`;
}

/** Busca videos libres en Wikimedia Commons (URL directa reproducible). */
export async function searchWikimediaCommons(query: string, limit = 20): Promise<MediaItem[]> {
  const search = encodeURIComponent(`${query} filetype:video`);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${search}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=320`;
  const data = await fetchJson(url);
  const pages = ((data.query as Record<string, unknown> | undefined)?.pages as Record<string, Record<string, unknown>>) ?? {};
  return Object.values(pages).map((p) => {
    const ii = ((p.imageinfo as Array<Record<string, unknown>>) ?? [])[0] ?? {};
    const title = String(p.title ?? "").replace(/^File:/, "");
    return {
      source: "wikimedia" as const,
      id: String(p.pageid ?? title),
      title,
      thumbnail: ii.thumburl ? String(ii.thumburl) : null,
      videoUrl: ii.url ? String(ii.url) : null,
      detailsUrl: ii.descriptionurl ? String(ii.descriptionurl) : `https://commons.wikimedia.org/wiki/${encodeURIComponent(String(p.title ?? ""))}`,
      mime: ii.mime ? String(ii.mime) : undefined,
    };
  });
}

/** Busca en varias fuentes a la vez. */
export async function searchMedia(query: string, source: "archive" | "wikimedia" | "all" = "all", limit = 20): Promise<MediaItem[]> {
  if (source === "archive") return searchInternetArchive(query, limit);
  if (source === "wikimedia") return searchWikimediaCommons(query, limit);
  const [a, w] = await Promise.all([
    searchInternetArchive(query, Math.ceil(limit / 2)),
    searchWikimediaCommons(query, Math.ceil(limit / 2)),
  ]);
  return [...w, ...a]; // Wikimedia primero (URL directa lista para reproducir)
}
