"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Camera, Lock, Search, Download, Play, Loader2, RefreshCw,
  Image as ImageIcon, Video as VideoIcon,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

const SECRET_STORE = "mpp_license_admin_secret";

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

export default function StockPage() {
  const [secret, setSecret] = useState("");
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [type, setType] = useState<"photo" | "video">("photo");
  const [results, setResults] = useState<StockItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Auto-auth con el secreto guardado (mismo de Integraciones)
  useEffect(() => {
    let s = ""; try { s = localStorage.getItem(SECRET_STORE) ?? ""; } catch {}
    if (s) { setSecret(s); setAuthed(true); }
  }, []);

  const runSearch = useCallback(async (query: string, t: "photo" | "video", p: number, append: boolean) => {
    if (!query.trim()) return;
    setLoading(true); setError(null); setSearched(true);
    try {
      const r = await fetch(`/api/admin/stock?q=${encodeURIComponent(query)}&type=${t}&page=${p}`, { headers: { "x-admin-secret": secret } });
      if (r.status === 401) { setAuthed(false); try { localStorage.removeItem(SECRET_STORE); } catch {} setAuthError("Secreto incorrecto."); return; }
      const d = await r.json();
      if (d.error) setError(d.error);
      setResults((prev) => append ? [...prev, ...(d.results ?? [])] : (d.results ?? []));
      setPage(p);
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }, [secret]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setResults([]);
    runSearch(q, type, 1, false);
  };

  const switchType = (t: "photo" | "video") => {
    setType(t);
    if (q.trim()) { setResults([]); runSearch(q, t, 1, false); }
  };

  if (!authed) {
    return (
      <AdminShell title="Banco de Medios" description="Fotos y videos reales de stock (Pexels) — solo SuperAdmin." icon={Camera} iconGradient="from-emerald-500 to-teal-600" status="live" breadcrumb={[{ label: "Banco de Medios" }]}>
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

  return (
    <AdminShell
      title="Banco de Medios"
      description="Busca fotos y videos reales de stock (Pexels) — gratis y con licencia comercial. Solo SuperAdmin."
      icon={Camera}
      iconGradient="from-emerald-500 to-teal-600"
      status="live"
      breadcrumb={[{ label: "Banco de Medios" }]}
    >
      <div className="space-y-4">
        {/* Buscador + tabs */}
        <div className="glass-card rounded-2xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => switchType("photo")} className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${type === "photo" ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow" : "bg-white/5 border border-white/10 text-white/60 hover:text-white"}`}>
              <ImageIcon className="w-3.5 h-3.5" /> Fotos
            </button>
            <button onClick={() => switchType("video")} className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${type === "video" ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow" : "bg-white/5 border border-white/10 text-white/60 hover:text-white"}`}>
              <VideoIcon className="w-3.5 h-3.5" /> Videos
            </button>
          </div>
          <form onSubmit={submit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca: playa, ciudad de noche, café, naturaleza…" className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40" />
            </div>
            <button type="submit" disabled={loading || !q.trim()} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow shadow-emerald-500/30 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Buscar
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-200 text-sm">{error}</div>
        )}

        {/* Resultados */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.map((item) => (
              <div key={`${item.type}-${item.id}`} className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumb} alt={item.author ?? "stock"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {item.type === "video" && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    {item.duration ? <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/50 text-white px-1.5 py-0.5 rounded backdrop-blur">{item.duration}s</span> : null}
                  </>
                )}

                {/* acciones */}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={item.url} target="_blank" rel="noreferrer" download className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-black/80" title="Descargar / abrir">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
                {item.author && (
                  <span className="absolute bottom-2 right-2 text-[9px] text-white/70 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity">© {item.author}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Cargar más */}
        {results.length > 0 && (
          <div className="text-center">
            <button onClick={() => runSearch(q, type, page + 1, true)} disabled={loading} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Cargar más
            </button>
          </div>
        )}

        {/* Vacío */}
        {searched && !loading && results.length === 0 && !error && (
          <div className="bg-white/3 border border-dashed border-white/15 rounded-2xl p-10 text-center">
            <Camera className="w-7 h-7 text-white/30 mx-auto mb-2" />
            <p className="text-white/45 text-sm">Sin resultados. Prueba otra búsqueda.</p>
          </div>
        )}
        {!searched && (
          <div className="bg-white/3 border border-dashed border-white/15 rounded-2xl p-10 text-center">
            <Camera className="w-7 h-7 text-white/30 mx-auto mb-2" />
            <p className="text-white/45 text-sm">Escribe una búsqueda para explorar fotos y videos reales de stock.</p>
            <p className="text-white/30 text-xs mt-1">Necesita la clave de Pexels conectada en Integraciones / APIs.</p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
