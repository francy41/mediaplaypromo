"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clapperboard, Lock, Sparkles, Wand2, Loader2, Play, Square, Download,
  Trash2, RefreshCw, Image as ImageIcon, Video as VideoIcon, Volume2, VolumeX, Film,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

const SECRET_STORE = "mpp_license_admin_secret";
type Transition = "fade" | "zoom" | "slide";

interface Media { type: "video" | "photo"; thumb: string; url: string }
interface Scene {
  id: string;
  narration: string;
  query: string;
  seconds: number;
  transition: Transition;
  media?: Media;
  loadingMedia?: boolean;
}

const DURATIONS = [
  { v: 30, label: "30s" }, { v: 60, label: "1 min" }, { v: 120, label: "2 min" },
  { v: 300, label: "5 min" }, { v: 600, label: "10 min" },
];
const ASPECTS = [
  { v: "16:9", label: "16:9 Horizontal", cls: "aspect-video" },
  { v: "9:16", label: "9:16 Vertical", cls: "aspect-[9/16]" },
  { v: "1:1", label: "1:1 Cuadrado", cls: "aspect-square" },
];

export default function EditorPage() {
  const [secret, setSecret] = useState("");
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(60);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [aspect, setAspect] = useState("16:9");
  const [voice, setVoice] = useState(true);

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [title, setTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // preview
  const [previewIndex, setPreviewIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // render
  const [rendering, setRendering] = useState(false);
  const [renderPct, setRenderPct] = useState(0);
  const [renderMsg, setRenderMsg] = useState("");

  // voces del narrador (Web Speech)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");

  useEffect(() => {
    let s = ""; try { s = localStorage.getItem(SECRET_STORE) ?? ""; } catch {}
    if (s) { setSecret(s); setAuthed(true); }
  }, []);

  // Cargar voces disponibles del navegador
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const aspectCls = ASPECTS.find((a) => a.v === aspect)?.cls ?? "aspect-video";
  const totalSec = scenes.reduce((a, s) => a + s.seconds, 0);
  const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(lang));

  const orientationFor = (a: string) => (a === "9:16" ? "portrait" : a === "1:1" ? "square" : "landscape");

  /* ── Candidatos de media para una escena (Pexels: video → foto, según formato) ── */
  const fetchCandidates = useCallback(async (query: string, orientation: string): Promise<Media[]> => {
    const out: Media[] = [];
    for (const t of ["video", "photo"] as const) {
      try {
        const r = await fetch(`/api/admin/stock?q=${encodeURIComponent(query)}&source=pexels&type=${t}&orientation=${orientation}`, { headers: { "x-admin-secret": secret } });
        const d = await r.json();
        for (const m of (d.results ?? [])) if (m?.url) out.push({ type: t, thumb: m.thumb, url: m.url });
      } catch { /* sigue */ }
      if (out.length >= 6) break; // con videos suele bastar → más consistente
    }
    return out;
  }, [secret]);

  /* ── Generar storyboard ── */
  const generate = async () => {
    if (!prompt.trim()) return;
    stopPreview();
    setGenerating(true); setError(null); setScenes([]);
    try {
      const r = await fetch("/api/admin/editor/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ prompt, durationSec: duration, lang }),
      });
      if (r.status === 401) { setAuthed(false); try { localStorage.removeItem(SECRET_STORE); } catch {} setAuthError("Secreto incorrecto."); return; }
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setTitle(d.title ?? prompt.slice(0, 60));
      const base: Scene[] = (d.scenes ?? []).map((s: { narration: string; query: string; seconds: number }, i: number) => ({
        id: `sc-${Date.now()}-${i}`, narration: s.narration, query: s.query, seconds: s.seconds, transition: "fade" as Transition, loadingMedia: true,
      }));
      setScenes(base);
      // Cargar candidatos en paralelo y asignar sin repetir (coherencia)
      const orientation = orientationFor(aspect);
      const candLists = await Promise.all(base.map((sc) => fetchCandidates(sc.query, orientation)));
      const used = new Set<string>();
      const withMedia = base.map((sc, i) => {
        const pick = candLists[i].find((c) => !used.has(c.url)) ?? candLists[i][0];
        if (pick) used.add(pick.url);
        return { ...sc, media: pick, loadingMedia: false };
      });
      setScenes(withMedia);
    } catch { setError("Error de conexión."); }
    finally { setGenerating(false); }
  };

  const updateScene = (id: string, patch: Partial<Scene>) => setScenes((p) => p.map((s) => s.id === id ? { ...s, ...patch } : s));
  const removeScene = (id: string) => setScenes((p) => p.filter((s) => s.id !== id));
  const reSearch = async (id: string, query: string) => {
    updateScene(id, { loadingMedia: true });
    const cands = await fetchCandidates(query, orientationFor(aspect));
    const used = new Set(scenes.filter((s) => s.id !== id).map((s) => s.media?.url).filter(Boolean) as string[]);
    const cur = scenes.find((s) => s.id === id)?.media?.url;
    const pick = cands.find((c) => !used.has(c.url) && c.url !== cur) ?? cands.find((c) => !used.has(c.url)) ?? cands[0];
    updateScene(id, { media: pick, loadingMedia: false });
  };

  /* ── Preview player ── */
  const speak = useCallback((text: string) => {
    if (!voice || typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "en" ? "en-US" : "es-ES";
      const v = voices.find((x) => x.voiceURI === voiceURI);
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    } catch { /* noop */ }
  }, [voice, lang, voices, voiceURI]);

  const stopPreview = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    setPreviewIndex(-1);
  }, []);

  // avanza escenas en preview
  useEffect(() => {
    if (previewIndex < 0) return;
    if (previewIndex >= scenes.length) { stopPreview(); return; }
    const sc = scenes[previewIndex];
    speak(sc.narration);
    timerRef.current = setTimeout(() => setPreviewIndex((i) => i + 1), sc.seconds * 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [previewIndex, scenes, speak, stopPreview]);

  useEffect(() => () => stopPreview(), [stopPreview]);

  const exportProject = () => {
    const data = { title, aspect, lang, voice, totalSec, scenes: scenes.map(({ id, narration, query, seconds, transition, media }) => ({ id, narration, query, seconds, transition, media })) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mpp-video-${Date.now()}.json`;
    a.click();
  };

  const renderMp4 = async () => {
    stopPreview();
    setRendering(true); setRenderPct(0); setRenderMsg("Iniciando…"); setError(null);
    try {
      const { renderVideo } = await import("@/lib/ai/render-video");
      const blob = await renderVideo(
        scenes.map((s) => ({ seconds: s.seconds, media: s.media })),
        aspect, secret,
        (msg, pct) => { setRenderMsg(msg); setRenderPct(pct); },
      );
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `mpp-video-${Date.now()}.mp4`;
      a.click();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al renderizar");
    } finally {
      setRendering(false);
    }
  };

  if (!authed) {
    return (
      <AdminShell title="Mega Editor de Video IA" description="Crea videos largos con IA: guión, clips, transiciones, voz y montaje. Solo SuperAdmin." icon={Clapperboard} iconGradient="from-violet-500 to-fuchsia-600" status="beta" breadcrumb={[{ label: "Mega Editor" }]}>
        <div className="glass-card rounded-2xl border border-white/10 p-8 max-w-md mx-auto text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/30 items-center justify-center mb-4"><Lock className="w-7 h-7 text-violet-400" /></div>
          <h2 className="text-white font-bold text-lg mb-1">Acceso SuperAdmin</h2>
          <p className="text-white/50 text-sm mb-5">Introduce el secreto de administrador.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) { setSecret(input.trim()); setAuthed(true); setAuthError(null); try { localStorage.setItem(SECRET_STORE, input.trim()); } catch {} } }} className="space-y-3">
            <input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Secreto de admin" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/40" />
            {authError && <p className="text-red-400 text-xs">{authError}</p>}
            <button type="submit" className="shine-btn w-full bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-violet-500/30">Entrar</button>
          </form>
        </div>
      </AdminShell>
    );
  }

  const cur = previewIndex >= 0 ? scenes[previewIndex] : null;

  return (
    <AdminShell
      title="Mega Editor de Video IA"
      description="Prompt → guión (NVIDIA) → clips reales (Pexels) → transiciones + voz → montaje. Solo SuperAdmin."
      icon={Clapperboard}
      iconGradient="from-violet-500 to-fuchsia-600"
      status="beta"
      breadcrumb={[{ label: "Mega Editor" }]}
    >
      <div className="grid lg:grid-cols-[360px_1fr] gap-4">
        {/* ── Panel de control ── */}
        <div className="space-y-3">
          <div className="glass-card rounded-2xl border border-white/10 p-4 space-y-3">
            <div>
              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Idea / Tema del video</label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="Ej: La historia del café en el mundo, estilo documental" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/40 resize-none" />
            </div>
            <div>
              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Duración</label>
              <div className="grid grid-cols-5 gap-1.5">
                {DURATIONS.map((d) => (
                  <button key={d.v} onClick={() => setDuration(d.v)} className={`py-2 rounded-lg text-[11px] font-bold transition-all ${duration === d.v ? "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white" : "bg-white/5 border border-white/10 text-white/60 hover:text-white"}`}>{d.label}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Idioma</label>
                <select value={lang} onChange={(e) => setLang(e.target.value as "es" | "en")} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/40">
                  <option value="es" className="bg-[#0f1219]">Español</option>
                  <option value="en" className="bg-[#0f1219]">English</option>
                </select>
              </div>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Formato</label>
                <select value={aspect} onChange={(e) => setAspect(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/40">
                  {ASPECTS.map((a) => <option key={a.v} value={a.v} className="bg-[#0f1219]">{a.label}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => setVoice((v) => !v)} className={`w-full inline-flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${voice ? "bg-violet-500/15 border-violet-500/30 text-violet-200" : "bg-white/5 border-white/10 text-white/50"}`}>
              {voice ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />} Narración con voz {voice ? "ON" : "OFF"}
            </button>
            {voice && (
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Voz del narrador</label>
                {langVoices.length > 0 ? (
                  <div className="flex gap-2">
                    <select value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)} className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/40">
                      <option value="" className="bg-[#0f1219]">Automática</option>
                      {langVoices.map((v) => <option key={v.voiceURI} value={v.voiceURI} className="bg-[#0f1219]">{v.name}</option>)}
                    </select>
                    <button type="button" onClick={() => speak(lang === "en" ? "This is a voice preview." : "Esta es una prueba de la voz del narrador.")} className="inline-flex items-center gap-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-3 rounded-xl flex-shrink-0" title="Probar voz">
                      <Volume2 className="w-3.5 h-3.5" /> Probar
                    </button>
                  </div>
                ) : (
                  <p className="text-white/35 text-[10px]">Tu navegador no expone voces para este idioma; se usará la voz por defecto del sistema.</p>
                )}
              </div>
            )}
            <button onClick={generate} disabled={generating || !prompt.trim()} className="shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:opacity-95 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-violet-500/30 disabled:opacity-50">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando guión…</> : <><Wand2 className="w-4 h-4" /> Generar storyboard</>}
            </button>
            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>

          {scenes.length > 0 && (
            <div className="glass-card rounded-2xl border border-white/10 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/55">Escenas</span><span className="text-white font-bold">{scenes.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/55">Duración total</span><span className="text-white font-bold">{totalSec}s</span>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => (previewIndex >= 0 ? stopPreview() : setPreviewIndex(0))} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold px-3 py-2 rounded-lg">
                  {previewIndex >= 0 ? <><Square className="w-3.5 h-3.5" /> Detener</> : <><Play className="w-3.5 h-3.5" /> Reproducir</>}
                </button>
                <button onClick={exportProject} className="inline-flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold px-3 py-2 rounded-lg" title="Exportar proyecto (JSON)">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
              <button onClick={renderMp4} disabled={rendering} className="w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold px-3 py-2.5 rounded-lg shadow shadow-violet-500/30 disabled:opacity-60">
                {rendering ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {renderMsg} {renderPct}%</> : <><Film className="w-3.5 h-3.5" /> Renderizar MP4 (gratis)</>}
              </button>
              {rendering && (
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-600 transition-all" style={{ width: `${renderPct}%` }} />
                </div>
              )}
              <p className="text-white/35 text-[10px] pt-1">Render en tu navegador (v1 sin audio embebido). Recomendado ≤ ~90s; videos largos pueden ir lentos.</p>
            </div>
          )}
        </div>

        {/* ── Preview + timeline ── */}
        <div className="space-y-4">
          {/* Preview stage */}
          <div className="glass-card rounded-2xl border border-white/10 p-3">
            <div className={`relative ${aspectCls} max-h-[60vh] mx-auto rounded-xl overflow-hidden bg-black border border-white/10`}>
              {cur ? (
                <div key={cur.id} className="absolute inset-0 animate-in fade-in duration-500">
                  {cur.media ? (
                    cur.media.type === "video" ? (
                      <video src={cur.media.url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cur.media.url} alt="" className="w-full h-full object-cover scale-105" style={{ animation: "kenburns 6s ease-out forwards" }} />
                    )
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-700 to-fuchsia-900" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-white text-sm sm:text-base font-semibold text-center drop-shadow">{cur.narration}</p>
                  </div>
                  <div className="absolute top-2 right-2 text-[10px] font-bold bg-black/50 text-white px-2 py-0.5 rounded backdrop-blur">{previewIndex + 1}/{scenes.length}</div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <Film className="w-10 h-10 text-white/20 mb-3" />
                  <p className="text-white/45 text-sm">{scenes.length > 0 ? "Pulsa Reproducir para previsualizar el montaje." : "Escribe una idea y genera el storyboard."}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline / storyboard */}
          {scenes.length > 0 && (
            <div className="space-y-2">
              {scenes.map((s, i) => (
                <div key={s.id} className="glass-card rounded-2xl border border-white/10 p-3 flex gap-3">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className="text-white/40 text-[11px] font-bold">{i + 1}</span>
                    <div className="w-24 h-16 rounded-lg overflow-hidden bg-black border border-white/10 relative">
                      {s.loadingMedia ? (
                        <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-white/40" /></div>
                      ) : s.media ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.media.thumb} alt="" className="w-full h-full object-cover" />
                          <span className="absolute bottom-0.5 left-0.5 text-white/80">{s.media.type === "video" ? <VideoIcon className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}</span>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30 text-[9px] text-center px-1">sin clip</div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <textarea value={s.narration} onChange={(e) => updateScene(s.id, { narration: e.target.value })} rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-violet-500/40 resize-none" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative flex-1 min-w-[140px]">
                        <input value={s.query} onChange={(e) => updateScene(s.id, { query: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white/80 focus:outline-none focus:border-violet-500/40" />
                      </div>
                      <button onClick={() => reSearch(s.id, s.query)} className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[11px] px-2 py-1.5 rounded-lg" title="Buscar otro clip"><RefreshCw className="w-3 h-3" /></button>
                      <select value={s.transition} onChange={(e) => updateScene(s.id, { transition: e.target.value as Transition })} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none">
                        <option value="fade" className="bg-[#0f1219]">Fade</option>
                        <option value="zoom" className="bg-[#0f1219]">Zoom</option>
                        <option value="slide" className="bg-[#0f1219]">Slide</option>
                      </select>
                      <input type="number" min={3} max={12} value={s.seconds} onChange={(e) => updateScene(s.id, { seconds: Math.min(Math.max(+e.target.value || 4, 3), 12) })} className="w-14 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none" />
                      <button onClick={() => removeScene(s.id)} className="inline-flex items-center bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-white/50 hover:text-red-300 px-2 py-1.5 rounded-lg"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes kenburns{from{transform:scale(1.05)}to{transform:scale(1.18)}}`}</style>
    </AdminShell>
  );
}
