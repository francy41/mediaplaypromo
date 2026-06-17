"use client";
import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Lock, Plus, Trash2, RefreshCw, Send, Film, Wand2, UploadCloud, Loader2, Repeat2, RotateCcw, Sparkles } from "lucide-react";
import { AdminShell, KPIGrid } from "@/components/admin/AdminShell";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const SALES_LINK = "https://mediaplaypromo.com/categories/editor-video/yf-auto-clip-v1";

const CAPTION_TEMPLATES = [
  {
    label: "🎬 Reels / TikTok",
    text: `¿Sigues editando videos uno por uno? 😵‍💫\n\nProcesa 100 clips en menos de 1 hora con YF Auto Clip ⚡\n\n✅ Audio replace masivo en segundos\n✅ Corte automático de clips\n✅ Convierte formatos al instante\n✅ 100% local — sin subir nada a la nube\n\n+2,800 creadores en LATAM ya ahorra horas cada semana 🔥\n\n🔗 Consíguelo aquí 👇\n${SALES_LINK}\n\n#edicióndevideo #creadordecontenido #automatización #YFAutoClip #videoedit #contentcreator #reels #tiktokedit #productividad #marketingdigital #herramientasdigitales #youtubetips #videocontent #emprendedores #workflow`,
  },
  {
    label: "📸 Instagram",
    text: `Hace 3 meses tardaba 6 horas editando 20 videos. Ahora tardo 45 minutos para 100. 🤯\n\nLa diferencia: YF Auto Clip.\n\nUna sola herramienta que automatiza todo:\n🎬 Audio replace en lote\n✂️ Corte y recorte al segundo\n🔄 Conversión de formatos\n💻 Todo en tu PC, sin internet\n\nSin suscripciones. Sin cuentas cloud. Sin complicaciones.\n\n¿Quieres recuperar tu tiempo? 👇\n${SALES_LINK}\n\n#creadordecontenido #edicióndevideo #YFAutoClip #productividad #automatización #youtubetips #videocreator #contentcreator #herramientasdigitales #emprendimientodigital #reels #shortvideo #videoedit #workflow`,
  },
  {
    label: "▶️ YouTube",
    text: `🔥 YF Auto Clip — Edita 100 videos en 1 hora\n\n¿Cuántas horas pierdes cada semana editando manualmente? Con YF Auto Clip automatizas la edición masiva de videos sin experiencia previa.\n\n⚡ QUÉ PUEDES HACER:\n• Audio replace automático en lote\n• Corte y recorte de clips al segundo exacto\n• Conversión de formatos (MP4, MOV, WebM y más)\n• 100% local — privacidad total, sin subir a servidores externos\n\n📊 RESULTADOS REALES:\n• Ahorra entre 3-8 horas de trabajo por semana\n• Procesa 100+ videos en menos de 1 hora\n• Más de 2,800 creadores en toda Latinoamérica ya lo usan\n\n💰 OBTÉN YF AUTO CLIP:\n${SALES_LINK}\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n🔔 Suscríbete para más herramientas de productividad para creadores\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n#YFAutoClip #edicióndevideo #automatización #creadordecontenido #productividad`,
  },
  {
    label: "⏰ Urgencia / CTA",
    text: `⏰ ¿Cuánto tiempo más vas a perder editando videos a mano?\n\nLa realidad: editar 20 videos manualmente = 4-6 horas de tu vida.\nCon YF Auto Clip: 20 videos = 12 minutos. ⚡\n\n🎯 Audio replace masivo\n🎯 Corte automático de clips\n🎯 Conversión de formatos\n🎯 Sin suscripciones ni cloud\n\n+2,800 creadores ya lo tienen. ¿Cuándo lo consigues tú?\n\n👉 PRECIO ESPECIAL:\n${SALES_LINK}\n\nCódigo de descuento: YFAUTOCLIP 🎁\n\n#YFAutoClip #edicióndevideo #herramientasdigitales #creadordecontenido #automatización #productividad #contentcreator #videoedit #emprendedoreslatinos #marketingdigital #reels #tiktok #youtube #workflow`,
  },
];

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
  const [caption, setCaption] = useState(CAPTION_TEMPLATES[0].text);
  const [activeTemplate, setActiveTemplate] = useState(0);

  // subida de archivos
  const [uploading, setUploading] = useState(false);
  const [upMsg, setUpMsg] = useState("");

  // distribución automática
  const [batchPlatforms, setBatchPlatforms] = useState<string[]>(["instagram", "tiktok", "youtube"]);
  const [batchTime, setBatchTime] = useState("10:00");
  const [batchStart, setBatchStart] = useState("");
  const [loopMode, setLoopMode] = useState(false);
  const [batchEnd, setBatchEnd] = useState("");

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
    setBulk(""); setCaption(CAPTION_TEMPLATES[0].text); setActiveTemplate(0);
    load(secret);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createSupabaseBrowserClient();
    const arr = Array.from(files);
    let done = 0;
    for (let i = 0; i < arr.length; i++) {
      const file = arr[i];
      setUpMsg(`Subiendo ${i + 1}/${arr.length}: ${file.name}`);
      try {
        const sr = await fetch("/api/content/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-secret": secret },
          body: JSON.stringify({ filename: file.name }),
        });
        const sd = await sr.json();
        if (!sr.ok) { setUpMsg(`Error: ${sd.error ?? "subida"}`); continue; }
        const up = await supabase.storage.from("content-videos").uploadToSignedUrl(sd.path, sd.token, file);
        if (up.error) { setUpMsg(`Error subiendo ${file.name}: ${up.error.message}`); continue; }
        await call(secret, "POST", { action: "add", videos: [{ video_url: sd.publicUrl, title: file.name, caption: caption || null }] });
        done++;
      } catch (e) {
        setUpMsg(`Error: ${e instanceof Error ? e.message : ""}`);
      }
    }
    setUpMsg(`✅ ${done} video(s) subidos a la carpeta`);
    setUploading(false);
    load(secret);
  };

  const del = async (id: string) => { await call(secret, "POST", { action: "delete", id }); load(secret); };

  const runBatch = async () => {
    if (loopMode) {
      if (!batchEnd) return alert("Selecciona una fecha de fin para el bucle.");
      const cycles = batchEnd ? Math.ceil((new Date(batchEnd).getTime() - new Date(batchStart || Date.now() + 86400000).getTime()) / (86400000 * queued)) + 1 : 1;
      if (!confirm(`¿Programar ${queued} video(s) en bucle hasta el ${batchEnd}? (~${Math.max(1, cycles)} ciclos)`)) return;
      setLoading(true);
      const r = await call(secret, "POST", { action: "batch-loop", platforms: batchPlatforms, time: batchTime, startDate: batchStart || undefined, endDate: batchEnd });
      const d = await r.json();
      if (d.ok) alert(`✅ ${d.scheduled} publicaciones programadas en ${d.cycles} ciclo(s)`);
      else alert(`Error: ${d.error}`);
    } else {
      if (!confirm("¿Programar todos los videos en cola, 1 por día?")) return;
      setLoading(true);
      await call(secret, "POST", { action: "batch", platforms: batchPlatforms, time: batchTime, startDate: batchStart || undefined });
    }
    load(secret);
  };

  const recycle = async () => {
    if (!confirm(`¿Volver a encolar los ${published} videos publicados para repetir el ciclo?`)) return;
    setLoading(true);
    await call(secret, "POST", { action: "recycle" });
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
              ⚠️ La publicación a redes aún no está conectada. Puedes cargar y programar videos (quedan listos), pero para que <b>publique solo</b> falta conectar GoHighLevel: conecta tus redes en GHL Social Planner y pásame el <b>token de la API</b> (Private Integration). En cuanto lo configures, todo lo programado se enviará a GHL.
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

            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${uploading ? "border-cyan-500/40 bg-cyan-500/5" : "border-white/15 hover:border-cyan-500/40 hover:bg-white/[0.03]"}`}
            >
              <input type="file" accept="video/*" multiple className="hidden" disabled={uploading} onChange={(e) => onFiles(e.target.files)} />
              {uploading ? (
                <><Loader2 className="w-7 h-7 text-cyan-400 animate-spin" /><span className="text-cyan-300 text-sm font-semibold">{upMsg || "Subiendo..."}</span></>
              ) : (
                <><UploadCloud className="w-8 h-8 text-cyan-400" /><span className="text-white font-bold text-sm">Arrastra tus videos aquí o haz clic</span><span className="text-white/40 text-[11px]">MP4, MOV, WebM · hasta 50MB cada uno</span></>
              )}
            </label>
            {!uploading && upMsg && <p className="text-green-400 text-xs mt-2">{upMsg}</p>}

            <div className="my-4 flex items-center gap-3 text-white/30 text-[10px] uppercase tracking-wider">
              <div className="flex-1 h-px bg-white/10" /> o pega URLs <div className="flex-1 h-px bg-white/10" />
            </div>

            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">URLs de video (una por línea)</label>
            <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={3} placeholder={"https://.../video1.mp4\nhttps://.../video2.mp4"} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 resize-none" />
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider">Texto / caption (para todos los videos)</label>
                <span className="text-white/30 text-[10px]">{caption.length} chars</span>
              </div>
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <Sparkles className="w-3 h-3 text-pink-400 flex-shrink-0" />
                {CAPTION_TEMPLATES.map((t, i) => (
                  <button key={i} type="button"
                    onClick={() => { setActiveTemplate(i); setCaption(t.text); }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${activeTemplate === i ? "bg-pink-500/25 text-pink-200 border border-pink-500/40" : "bg-white/5 text-white/45 border border-white/10 hover:text-white/80 hover:border-white/20"}`}>
                    {t.label}
                  </button>
                ))}
                <button type="button"
                  onClick={() => { setActiveTemplate(-1); setCaption(""); }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors bg-white/5 text-white/30 border border-white/10 hover:text-white/60">
                  Limpiar
                </button>
              </div>
              <textarea
                value={caption}
                onChange={(e) => { setCaption(e.target.value); setActiveTemplate(-1); }}
                rows={8}
                placeholder="Escribe o selecciona un template de marketing arriba..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 resize-y leading-relaxed"
              />
              <p className="text-white/30 text-[10px] mt-1">💡 Los templates incluyen copy optimizado + hashtags + enlace de ventas para YF Auto Clip</p>
            </div>
            <button onClick={addVideos} className="mt-3 inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow shadow-cyan-500/30"><Plus className="w-3.5 h-3.5" /> Añadir a la cola</button>
          </div>

          {/* Distribución automática */}
          <div className="glass-card rounded-2xl border border-violet-500/25 bg-violet-500/[0.03] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-2 text-white font-bold text-sm">
                <Wand2 className="w-4 h-4 text-violet-400" /> Programar automático
              </h3>
              {/* Toggle modo bucle */}
              <button
                onClick={() => setLoopMode(!loopMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  loopMode
                    ? "bg-violet-500/20 border-violet-400/40 text-violet-300"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                }`}
              >
                <Repeat2 className="w-3.5 h-3.5" />
                Modo bucle {loopMode ? "ON" : "OFF"}
              </button>
            </div>

            {loopMode && (
              <div className="mb-3 rounded-xl border border-violet-500/30 bg-violet-500/[0.06] p-3 text-xs text-violet-200/80">
                <Repeat2 className="w-3.5 h-3.5 inline mr-1.5 text-violet-400" />
                Los <b>{queued} videos en cola</b> se repetirán cíclicamente 1 por día hasta la fecha de fin. El ciclo se reinicia automáticamente cuando termina la lista.
              </div>
            )}

            <div className={`grid gap-3 mb-3 ${loopMode ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Empezar el</label>
                <input type="date" value={batchStart} onChange={(e) => setBatchStart(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/40" />
              </div>
              {loopMode && (
                <div>
                  <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Repetir hasta</label>
                  <input type="date" value={batchEnd} onChange={(e) => setBatchEnd(e.target.value)} className="w-full bg-white/5 border border-violet-400/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/40" />
                </div>
              )}
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Hora</label>
                <input type="time" value={batchTime} onChange={(e) => setBatchTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/40" />
              </div>
            </div>

            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Redes</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {PLATFORMS.map((p) => (
                <button key={p} onClick={() => togglePlat(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${batchPlatforms.includes(p) ? "bg-violet-500/25 text-violet-200 border border-violet-500/40" : "bg-white/5 text-white/50 border border-white/10"}`}>{p}</button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={runBatch}
                disabled={queued === 0 || loading}
                className="shine-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-violet-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-lg shadow-violet-500/30 disabled:opacity-50"
              >
                {loopMode ? <Repeat2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                {loopMode ? `Programar bucle (${queued} videos en ciclo)` : `Programar los ${queued} en cola, 1 por día`}
              </button>

              {published > 0 && (
                <button
                  onClick={recycle}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reciclar {published} publicadas → cola
                </button>
              )}
            </div>

            {loopMode && (
              <p className="text-white/35 text-[10px] mt-2">
                Tip: cuando los videos se publiquen, usa <b>Reciclar publicadas</b> para volverlos a encolar y repetir el ciclo indefinidamente.
              </p>
            )}
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
