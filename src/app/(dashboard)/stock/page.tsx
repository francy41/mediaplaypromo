"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Camera, Lock, Search, Download, Play, Loader2, RefreshCw, X, Film,
  Image as ImageIcon, Video as VideoIcon, Clapperboard, ExternalLink, Plus, ArrowRight,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ensureAdminSecret } from "@/lib/admin-secret";

const SECRET_STORE = "mpp_license_admin_secret";
const PRODUCTION_QUEUE = "mpp_production_queue";

interface ProdItem { type: "video" | "photo"; url: string; thumb: string; title?: string }
type Source = "pexels" | "archive" | "wikimedia";
type MediaType = "photo" | "video";

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
}

export default function StockPage() {
  const [secret, setSecret] = useState("");
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [source, setSource] = useState<Source>("pexels");
  const [type, setType] = useState<MediaType>("photo");
  const [archiveMedia, setArchiveMedia] = useState<"video" | "audio" | "all">("video");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<StockItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [playing, setPlaying] = useState<StockItem | null>(null);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    let qc = 0; try { qc = (JSON.parse(localStorage.getItem(PRODUCTION_QUEUE) || "[]") as ProdItem[]).length; } catch {}
    const t = setTimeout(async () => {
      setQueueCount(qc);
      const s = await ensureAdminSecret(); // acceso directo si hay sesión de admin
      if (s) { setSecret(s); setAuthed(true); }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const toProdItem = (it: StockItem): ProdItem =>
    it.type === "archive"
      ? { type: "photo", url: it.thumb, thumb: it.thumb, title: it.title }
      : { type: it.type as "video" | "photo", url: it.url, thumb: it.thumb, title: it.author || it.title };

  const addToProduction = (items: StockItem[]) => {
    let q: ProdItem[] = [];
    try { q = JSON.parse(localStorage.getItem(PRODUCTION_QUEUE) || "[]"); } catch {}
    const existing = new Set(q.map((x) => x.url));
    const mapped = items.map(toProdItem).filter((m) => m.url && !existing.has(m.url));
    const merged = [...q, ...mapped];
    try { localStorage.setItem(PRODUCTION_QUEUE, JSON.stringify(merged)); } catch {}
    setQueueCount(merged.length);
  };

  const runSearch = useCallback(async (query: string, src: Source, t: MediaType, media: string, p: number, append: boolean) => {
    if (!query.trim()) return;
    setLoading(true); setError(null); setSearched(true);
    try {
      const r = await fetch(`/api/admin/stock?q=${encodeURIComponent(query)}&source=${src}&type=${t}&media=${media}&page=${p}`, { headers: { "x-admin-secret": secret } });
      if (r.status === 401) { setAuthed(false); try { localStorage.removeItem(SECRET_STORE); } catch {} setAuthError("Secreto incorrecto."); return; }
      const d = await r.json();
      if (d.error) setError(d.error);
      setResults((prev) => append ? [...prev, ...(d.results ?? [])] : (d.results ?? []));
      setPage(p);
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }, [secret]);

  const submit = (e: React.FormEvent) => { e.preventDefault(); setResults([]); runSearch(q, source, type, archiveMedia, 1, false); };
  const switchSource = (src: Source) => { setSource(src); setResults([]); setSearched(false); if (q.trim()) runSearch(q, src, type, archiveMedia, 1, false); };
  const switchType = (t: MediaType) => { setType(t); if (q.trim()) { setResults([]); runSearch(q, source, t, archiveMedia, 1, false); } };
  const switchArchiveMedia = (m: "video" | "audio" | "all") => { setArchiveMedia(m); if (q.trim()) { setResults([]); runSearch(q, source, type, m, 1, false); } };
  const quickSearch = (term: string) => { setQ(term); setResults([]); runSearch(term, source, type, archiveMedia, 1, false); };

  if (!authed) {
    return (
      <AdminShell title="Banco de Medios" description="Stock real (Pexels) + películas y documentales (Internet Archive) — solo SuperAdmin." icon={Camera} iconGradient="from-emerald-500 to-teal-600" status="live" breadcrumb={[{ label: "Banco de Medios" }]}>
        <div className="glass-card rounded-2xl border border-white/10 p-8 max-w-md mx-auto text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mb-4"><Lock className="w-7 h-7 text-emerald-400" /></div>
          <h2 className="text-white font-bold text-lg mb-1">Acceso SuperAdmin</h2>
          <p className="text-white/50 text-sm mb-5">Introduce el secreto de administrador.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) { setSecret(input.trim()); setAuthed(true); setAuthError(null); try { localStorage.setItem(SECRET_STORE, input.trim()); } catch {} } }} className="space-y-3">
            <input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Secreto de admin" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40" />
            {authError && <p className="text-red-400 text-xs">{authError}</p>}
            <button type="submit" className="shine-btn w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/30">Entrar</button>
          </form>
        </div>
      </AdminShell>
    );
  }

  const isArchive = source === "archive";

  return (
    <AdminShell
      title="Banco de Medios"
      description="Fotos/videos de stock (Pexels) y películas/documentales de dominio público (Internet Archive). Solo SuperAdmin."
      icon={Camera}
      iconGradient="from-emerald-500 to-teal-600"
      status="live"
      breadcrumb={[{ label: "Banco de Medios" }]}
    >
      <div className="space-y-4">
        {/* Fuente */}
        <div className="flex items-center gap-2">
          <button onClick={() => switchSource("pexels")} className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${source === "pexels" ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow" : "bg-white/5 border border-white/10 text-white/60 hover:text-white"}`}>
            <Camera className="w-3.5 h-3.5" /> Stock (Pexels)
          </button>
          <button onClick={() => switchSource("archive")} className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${source === "archive" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow" : "bg-white/5 border border-white/10 text-white/60 hover:text-white"}`}>
            <Clapperboard className="w-3.5 h-3.5" /> Archivo & Documentales
          </button>
          <button onClick={() => switchSource("wikimedia")} className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${source === "wikimedia" ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow" : "bg-white/5 border border-white/10 text-white/60 hover:text-white"}`}>
            <Film className="w-3.5 h-3.5" /> Wikimedia
          </button>
        </div>

        {/* Buscador + (subtabs Pexels) */}
        <div className="glass-card rounded-2xl border border-white/10 p-4">
          {source === "pexels" && (
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => switchType("photo")} className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${type === "photo" ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" : "bg-white/5 border border-white/10 text-white/60 hover:text-white"}`}>
                <ImageIcon className="w-3.5 h-3.5" /> Fotos
              </button>
              <button onClick={() => switchType("video")} className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${type === "video" ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" : "bg-white/5 border border-white/10 text-white/60 hover:text-white"}`}>
                <VideoIcon className="w-3.5 h-3.5" /> Videos
              </button>
            </div>
          )}
          {isArchive && (
            <div className="flex items-center gap-2 mb-3">
              {([["video", "Video"], ["audio", "Audio"], ["all", "Todo"]] as const).map(([m, label]) => (
                <button key={m} onClick={() => switchArchiveMedia(m)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${archiveMedia === m ? "bg-amber-500/20 border border-amber-500/30 text-amber-300" : "bg-white/5 border border-white/10 text-white/60 hover:text-white"}`}>{label}</button>
              ))}
            </div>
          )}
          <form onSubmit={submit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={isArchive ? "Busca: noticias, entrevista, política, discurso, history…" : "Busca: playa, ciudad de noche, café…"} className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40" />
            </div>
            <button type="submit" disabled={loading || !q.trim()} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow shadow-emerald-500/30 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Buscar
            </button>
          </form>
          {isArchive && (
            <>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {["Noticias", "Entrevistas", "Política", "Discursos", "Documentales", "Historia", "News", "Interviews"].map((c) => (
                  <button key={c} onClick={() => quickSearch(c)} className="text-[11px] bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white px-2.5 py-1 rounded-full transition-colors">{c}</button>
                ))}
              </div>
              <p className="text-amber-300/70 text-[10px] mt-2">⚠️ Archive.org mezcla dominio público y contenido con derechos — verifica la licencia de cada ítem antes de uso comercial.</p>
            </>
          )}
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-200 text-sm">{error}</div>}

        {/* Barra producción */}
        {(results.length > 0 || queueCount > 0) && (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {results.length > 0 ? (
              <button onClick={() => addToProduction(results)} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow shadow-violet-500/30">
                <Plus className="w-3.5 h-3.5" /> Añadir todos a producción
              </button>
            ) : <span />}
            {queueCount > 0 && (
              <Link href="/editor" className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl">
                <Clapperboard className="w-3.5 h-3.5 text-violet-400" /> {queueCount} en producción · Abrir Mega Editor <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}

        {/* Resultados */}
        {results.length > 0 && (
          <div className={`grid gap-3 ${isArchive ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
            {results.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className={`group relative ${isArchive ? "aspect-video" : "aspect-square"} rounded-2xl overflow-hidden border border-white/10 bg-black ${isArchive ? "cursor-pointer" : ""}`}
                onClick={isArchive ? () => setPlaying(item) : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumb} alt={item.title ?? item.author ?? "media"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {(item.type === "video" || item.type === "archive") && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                )}
                {item.type === "video" && item.duration ? (
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/50 text-white px-1.5 py-0.5 rounded backdrop-blur">{item.duration}s</span>
                ) : null}

                {/* Archive: título + año */}
                {isArchive && (
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-white text-[12px] font-bold leading-tight line-clamp-2 drop-shadow">{item.title}</p>
                    {item.year ? <span className="text-white/60 text-[10px]">{item.year}</span> : null}
                  </div>
                )}

                {/* Acciones */}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); addToProduction([item]); }} className="w-8 h-8 rounded-lg bg-violet-600/80 backdrop-blur border border-violet-400/40 flex items-center justify-center text-white hover:bg-violet-600" title="Añadir a producción">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <a onClick={(e) => e.stopPropagation()} href={item.url} target="_blank" rel="noreferrer" download={!isArchive} className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-black/80" title={isArchive ? "Abrir en archive.org" : "Descargar / abrir"}>
                    {isArchive ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                  </a>
                </div>
                {!isArchive && item.author && (
                  <span className="absolute bottom-2 right-2 text-[9px] text-white/70 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity">© {item.author}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="text-center">
            <button onClick={() => runSearch(q, source, type, archiveMedia, page + 1, true)} disabled={loading} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Cargar más
            </button>
          </div>
        )}

        {searched && !loading && results.length === 0 && !error && (
          <div className="bg-white/3 border border-dashed border-white/15 rounded-2xl p-10 text-center">
            <Camera className="w-7 h-7 text-white/30 mx-auto mb-2" />
            <p className="text-white/45 text-sm">Sin resultados. Prueba otra búsqueda.</p>
          </div>
        )}
        {!searched && (
          <div className="bg-white/3 border border-dashed border-white/15 rounded-2xl p-10 text-center">
            {isArchive ? <Film className="w-7 h-7 text-white/30 mx-auto mb-2" /> : <Camera className="w-7 h-7 text-white/30 mx-auto mb-2" />}
            <p className="text-white/45 text-sm">{isArchive ? "Busca películas y documentales de dominio público (Internet Archive)." : "Busca fotos y videos reales de stock (Pexels)."}</p>
          </div>
        )}
      </div>

      {/* Reproductor (archive embed) */}
      {playing && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur flex items-center justify-center p-4" onClick={() => setPlaying(null)}>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2 gap-3">
              <p className="text-white font-bold text-sm truncate">{playing.title}{playing.year ? ` · ${playing.year}` : ""}</p>
              <div className="flex items-center gap-3 flex-shrink-0">
                <a href={playing.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-xs">archive.org <ExternalLink className="w-3 h-3" /></a>
                <button onClick={() => setPlaying(null)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
              <iframe src={playing.embed} className="w-full h-full" allow="fullscreen" />
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
