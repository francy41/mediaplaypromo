"use client";
import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Lock, Plus, Trash2, RefreshCw, Send, Film, Wand2 } from "lucide-react";
import { AdminShell, KPIGrid } from "@/components/admin/AdminShell";

interface Post {
  id: string;
  title: string | null;
  video_url: string;
  caption: string | null;
  platforms: string[] | null;
  scheduled_at: string | null;
  status: string;
  error: string | null;
  created_at: string | null;
}

const SECRET_STORE = "mpp_license_admin_secret";
const PLATFORMS = ["instagram", "facebook", "youtube", "tiktok", "linkedin"];

export default function ContentPlannerPage() {
  const [secret, setSecret] = useState("");
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [ghlEnabled, setGhlEnabled] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // formulario de alta
  const [bulk, setBulk] = useState("");
  const [caption, setCaption] = useState("");

  // distribución automática
  const [batchPlatforms, setBatchPlatforms] = useState<string[]>(["instagram", "tiktok", "youtube"]);
  const [batchTime, setBatchTime] = useState("10:00");
  const [batchStart, setBatchStart] = useState("");

  const call = useCallback((sec: string, method: string, body?: unknown) =>
    fetch("/api/content", {
      method,
      headers: { "Content-Type": "application/json", "x-admin-secret": sec },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }), []);

  const load = useCallback(async (sec: string) => {
    setLoading(true); setError(null);
    try {
      const r = await call(sec, "GET");
      if (r.status === 401) { setAuthed(false); try { localStorage.removeItem(SECRET_STORE); } catch {} setError("Secreto incorrecto."); return; }
      const d = await r.json();
      setPosts(d.posts ?? []); setGhlEnabled(!!d.ghlEnabled); setSecret(sec); setAuthed(true);
      try { localStorage.setItem(SECRET_STORE, sec); } catch {}
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }, [call]);

  useEffect(() => {
    let s = ""; try { s = localStorage.getItem(SECRET_STORE) ?? ""; } catch {}
    if (s) load(s);
  }, [load]);

  const addVideos = async () => {
    const urls = bulk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (urls.length === 0) return;
    const videos = urls.map((u) => ({ video_url: u, caption: caption || null }));
    await call(secret, "POST", { action: "add", videos });
    setBulk(""); setCaption("");
    load(secret);
  };

  const del = async (id: string) => { await call(secret, "POST", { action: "delete", id }); load(secret); };

  const runBatch = async () => {
    if (!confirm("¿Programar todos los videos en cola, 1 por día?")) return;
    setLoading(true);
    await call(secret, "POST", { action: "batch", platforms: batchPlatforms, time: batchTime, startDate: batchStart || undefined });
    load(secret);
  };

  const togglePlat = (p: string) =>
    setBatchPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const queued = posts.filter((p) => p.status === "queued").length;
  const scheduled = posts.filter((p) => p.status === "scheduled").length;
  const published = posts.filter((p) => p.status === "published").length;

  return (
    <AdminShell
      title="Planificador de Contenido"
      description="Carga videos, ponles horarios y publícalos en tus redes automáticamente."
      icon={CalendarClock}
      iconGradient="from-pink-500 to-violet-600"
      status="live"
      breadcrumb={[{ label: "Planificador" }]}
      actions={authed && (
        <button onClick={() => load(secret)} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </button>
      )}
    >
      {!authed ? (
        <div className="glass-card rounded-2xl border border-white/10 p-8 max-w-md mx-auto text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-pink-500/15 border border-pink-500/30 items-center justify-center mb-4"><Lock className="w-7 h-7 text-pink-400" /></div>
          <h2 className="text-white font-bold text-lg mb-1">Planificador de Contenido</h2>
          <p className="text-white/50 text-sm mb-5">Introduce el secreto de administrador.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) load(input.trim()); }} className="space-y-3">
            <input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Secreto de admin" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/40" />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" className="shine-btn w-full bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-pink-500/30">Entrar</button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          {!ghlEnabled && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4 text-sm text-amber-200/90">
              ⚠️ La publicación a redes aún no está conectada. Puedes cargar y programar videos (quedan listos), pero para que **publique solo** falta conectar GoHighLevel: conecta tus redes en GHL Social Planner y pásame el <b>token de la API</b> (Private Integration). En cuanto lo configures, todo lo programado se enviará a GHL.
            </div>
          )}

          <KPIGrid kpis={[
            { label: "En cola", value: queued, gradient: "from-cyan-500 to-blue-600" },
            { label: "Programados", value: scheduled, gradient: "from-pink-500 to-violet-600" },
            { label: "Publicados", value: published, gradient: "from-green-500 to-emerald-600" },
          ]} />

          {/* Cargar videos (la "carpeta") */}
          <div className="glass-card rounded-2xl border border-white/10 p-5">
            <h3 className="flex items-center gap-2 text-white font-bold text-sm mb-3"><Film className="w-4 h-4 text-cyan-400" /> Cargar videos a la carpeta</h3>
            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">URLs de video (una por línea)</label>
            <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={3} placeholder={"https://.../video1.mp4\nhttps://.../video2.mp4"} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 resize-none" />
            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5 mt-3">Texto / caption (opcional, para todos)</label>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="🔥 Mira esto... #YFAutoClip" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40" />
            <button onClick={addVideos} className="mt-3 inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow shadow-cyan-500/30"><Plus className="w-3.5 h-3.5" /> Añadir a la cola</button>
            <p className="text-white/35 text-[10px] mt-2">Cada URL debe ser pública (el video accesible directamente). Pronto añadiremos subida directa.</p>
          </div>

          {/* Distribución automática */}
          <div className="glass-card rounded-2xl border border-violet-500/25 bg-violet-500/[0.03] p-5">
            <h3 className="flex items-center gap-2 text-white font-bold text-sm mb-3"><Wand2 className="w-4 h-4 text-violet-400" /> Programar automático (1 por día)</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Empezar el</label>
                <input type="date" value={batchStart} onChange={(e) => setBatchStart(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/40" />
              </div>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Hora</label>
                <input type="time" value={batchTime} onChange={(e) => setBatchTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/40" />
              </div>
            </div>
            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Redes</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PLATFORMS.map((p) => (
                <button key={p} onClick={() => togglePlat(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${batchPlatforms.includes(p) ? "bg-violet-500/25 text-violet-200 border border-violet-500/40" : "bg-white/5 text-white/50 border border-white/10"}`}>{p}</button>
              ))}
            </div>
            <button onClick={runBatch} disabled={queued === 0 || loading} className="shine-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-violet-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-lg shadow-violet-500/30 disabled:opacity-50"><Send className="w-3.5 h-3.5" /> Programar los {queued} en cola, 1 por día</button>
          </div>

          {/* Tabla */}
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-white/8 text-white/45 text-[10px] uppercase tracking-wider">
                    <th className="text-left font-bold px-4 py-3">Video</th>
                    <th className="text-left font-bold px-4 py-3">Estado</th>
                    <th className="text-left font-bold px-4 py-3">Programado</th>
                    <th className="text-left font-bold px-4 py-3">Redes</th>
                    <th className="text-right font-bold px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 max-w-[240px]">
                        <a href={p.video_url} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:text-cyan-200 text-xs font-mono truncate block">{p.title || p.video_url}</a>
                        {p.caption && <span className="text-white/40 text-[11px] truncate block">{p.caption}</span>}
                        {p.error && <span className="text-red-400 text-[10px] block">⚠ {p.error}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          p.status === "published" ? "bg-green-500/15 text-green-400 border border-green-500/30"
                          : p.status === "scheduled" ? "bg-pink-500/15 text-pink-300 border border-pink-500/30"
                          : p.status === "failed" ? "bg-red-500/15 text-red-400 border border-red-500/30"
                          : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"}`}>
                          {p.status === "queued" ? "En cola" : p.status === "scheduled" ? "Programado" : p.status === "published" ? "Publicado" : "Error"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/55 text-xs">{p.scheduled_at ? new Date(p.scheduled_at).toLocaleString() : "—"}</td>
                      <td className="px-4 py-3 text-white/50 text-[11px] capitalize">{(p.platforms ?? []).join(", ") || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => del(p.id)} className="inline-flex items-center gap-1 bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-300 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                  {posts.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-white/40 text-sm">Tu carpeta está vacía. Añade URLs de video arriba para empezar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
