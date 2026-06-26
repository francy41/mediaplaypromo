"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clapperboard, Lock, Wand2, Loader2, Play, Square, Download, Trash2, RefreshCw,
  Video as VideoIcon, Volume2, VolumeX, Film, Search, Plus,
  ChevronLeft, ChevronRight, FolderInput, Upload, X,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

const SECRET_STORE = "mpp_license_admin_secret";
const PRODUCTION_QUEUE = "mpp_production_queue";
type Transition = "fade" | "zoom" | "slide";
type Effect = "none" | "bw" | "blur" | "bright" | "zoom";

interface Media { type: "video" | "photo"; thumb: string; url: string }
interface Clip {
  id: string;
  media?: Media;
  narration: string;
  query: string;
  visual: string;   // prompt rico para imagen IA (NVIDIA)
  seconds: number;
  startSec: number;
  transition: Transition;
  effect: Effect;
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
const GEN_SOURCES = [
  { v: "mix", label: "Mixto · todas las fuentes (recomendado)" },
  { v: "pexels-video", label: "Pexels · Video" },
  { v: "pexels-photo", label: "Pexels · Fotos" },
  { v: "nvidia", label: "NVIDIA · Imágenes IA (gratis)" },
];
const EFFECTS: { v: Effect; label: string }[] = [
  { v: "none", label: "Sin efecto" }, { v: "zoom", label: "Zoom (Ken Burns)" },
  { v: "bw", label: "Blanco y negro" }, { v: "blur", label: "Desenfoque" }, { v: "bright", label: "Brillo+" },
];

// Voces (acentos de Google TTS, gratis). El idioma del guión se deriva del código.
const VOICE_OPTIONS = [
  { v: "es", label: "Español (España) · Femenina" },
  { v: "es-us", label: "Español (Latinoamérica)" },
  { v: "en", label: "English (US)" },
  { v: "en-gb", label: "English (UK)" },
  { v: "en-au", label: "English (Australia)" },
];

const cssFilter = (e: Effect) => e === "bw" ? "grayscale(1)" : e === "blur" ? "blur(3px)" : e === "bright" ? "brightness(1.2) saturate(1.25)" : "none";
const uid = () => `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function EditorPage() {
  const [secret, setSecret] = useState("");
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // IA
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(60);
  const [aspect, setAspect] = useState("16:9");
  const [genSource, setGenSource] = useState("mix");
  const [voice, setVoice] = useState(true);
  const [voiceCode, setVoiceCode] = useState("es");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [customAudio, setCustomAudio] = useState<{ name: string; file: File; url: string } | null>(null);
  const [customAudioDur, setCustomAudioDur] = useState(0);
  const audioFileRef = useRef<HTMLInputElement | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // timeline
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState(0);

  // media browser
  const [mSource, setMSource] = useState<"video" | "photo" | "archive" | "wikimedia">("video");
  const [mQuery, setMQuery] = useState("");
  const [mResults, setMResults] = useState<Media[]>([]);
  const [mLoading, setMLoading] = useState(false);

  // preview / render
  const [previewIndex, setPreviewIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderPct, setRenderPct] = useState(0);
  const [renderMsg, setRenderMsg] = useState("");

  useEffect(() => {
    let s = ""; try { s = localStorage.getItem(SECRET_STORE) ?? ""; } catch {}
    if (s) { setSecret(s); setAuthed(true); }
    try { setQueueCount((JSON.parse(localStorage.getItem(PRODUCTION_QUEUE) || "[]") as Media[]).length); } catch {}
  }, []);

  const lang: "es" | "en" = voiceCode.startsWith("es") ? "es" : "en";
  const aspectCls = ASPECTS.find((a) => a.v === aspect)?.cls ?? "aspect-video";
  const totalSec = clips.reduce((a, s) => a + s.seconds, 0);
  const orientationFor = (a: string) => (a === "9:16" ? "portrait" : a === "1:1" ? "square" : "landscape");
  const selected = clips.find((c) => c.id === selectedId) ?? null;

  /* ── Búsquedas de media ── */
  const pexels = useCallback(async (query: string, type: "video" | "photo", orientation: string): Promise<Media[]> => {
    try {
      const r = await fetch(`/api/admin/stock?q=${encodeURIComponent(query)}&source=pexels&type=${type}&orientation=${orientation}`, { headers: { "x-admin-secret": secret } });
      const d = await r.json();
      return (d.results ?? []).filter((m: Media) => m?.url).map((m: { type: "video" | "photo"; thumb: string; url: string }) => ({ type, thumb: m.thumb, url: m.url }));
    } catch { return []; }
  }, [secret]);

  const wikimedia = useCallback(async (query: string): Promise<Media[]> => {
    try {
      const r = await fetch(`/api/admin/stock?q=${encodeURIComponent(query)}&source=wikimedia`, { headers: { "x-admin-secret": secret } });
      const d = await r.json();
      return (d.results ?? []).filter((m: { url?: string }) => m.url).map((m: { thumb: string; url: string }) => ({ type: "video" as const, thumb: m.thumb, url: m.url }));
    } catch { return []; }
  }, [secret]);

  const nvidiaImage = useCallback(async (p: string): Promise<Media | undefined> => {
    try {
      const r = await fetch("/api/ai/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "nvidia", model: "black-forest-labs/flux.1-schnell", prompt: p, width: 1024, height: 1024 }) });
      const d = await r.json();
      const url = d.output?.[0];
      return url ? { type: "photo", thumb: url, url } : undefined;
    } catch { return undefined; }
  }, []);

  const sceneMedia = useCallback(async (query: string, visual: string, orientation: string): Promise<Media[]> => {
    if (genSource === "nvidia") { const m = await nvidiaImage(visual || query); return m ? [m] : []; }
    if (genSource === "mix") {
      // cadena: Pexels video → Wikimedia → Pexels fotos → NVIDIA IA
      let out = await pexels(query, "video", orientation);
      if (out.length) return out;
      out = await wikimedia(query);
      if (out.length) return out;
      out = await pexels(query, "photo", orientation);
      if (out.length) return out;
      const m = await nvidiaImage(visual || query);
      return m ? [m] : [];
    }
    const type = genSource === "pexels-photo" ? "photo" : "video";
    const out = await pexels(query, type, orientation);
    if (out.length === 0 && type === "video") return pexels(query, "photo", orientation);
    return out;
  }, [genSource, pexels, wikimedia, nvidiaImage]);

  /* ── Generar storyboard (IA) ── */
  const generate = async () => {
    if (!prompt.trim()) return;
    stopPreview();
    setGenerating(true); setError(null); setClips([]); setSelectedId(null);
    try {
      const r = await fetch("/api/admin/editor/plan", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": secret }, body: JSON.stringify({ prompt, durationSec: duration, lang }) });
      if (r.status === 401) { setAuthed(false); try { localStorage.removeItem(SECRET_STORE); } catch {} setAuthError("Secreto incorrecto."); return; }
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      const base: Clip[] = (d.scenes ?? []).map((s: { narration: string; query: string; visual?: string; seconds: number }) => ({
        id: uid(), narration: s.narration, query: s.query, visual: s.visual || s.query, seconds: s.seconds, startSec: 0, transition: "fade" as Transition, effect: "none" as Effect, loadingMedia: true,
      }));
      setClips(base);
      const ori = orientationFor(aspect);
      const lists = await Promise.all(base.map((c) => sceneMedia(c.query, c.visual, ori)));
      const used = new Set<string>();
      setClips(base.map((c, i) => {
        const pick = lists[i].find((m) => !used.has(m.url)) ?? lists[i][0];
        if (pick) used.add(pick.url);
        return { ...c, media: pick, loadingMedia: false };
      }));
      if (customAudioDur >= 2) fitToAudio(customAudioDur); // cuadra los clips con tu audio
    } catch { setError("Error de conexión."); }
    finally { setGenerating(false); }
  };

  /* ── Media browser ── */
  const searchMedia = async () => {
    if (!mQuery.trim()) return;
    setMLoading(true);
    try {
      if (mSource === "archive") {
        const r = await fetch(`/api/admin/stock?q=${encodeURIComponent(mQuery)}&source=archive&media=video`, { headers: { "x-admin-secret": secret } });
        const d = await r.json();
        setMResults((d.results ?? []).map((m: { thumb: string }) => ({ type: "photo" as const, thumb: m.thumb, url: m.thumb })));
      } else if (mSource === "wikimedia") {
        const r = await fetch(`/api/admin/stock?q=${encodeURIComponent(mQuery)}&source=wikimedia`, { headers: { "x-admin-secret": secret } });
        const d = await r.json();
        setMResults((d.results ?? []).filter((m: { url?: string }) => m.url).map((m: { thumb: string; url: string }) => ({ type: "video" as const, thumb: m.thumb, url: m.url })));
      } else {
        setMResults(await pexels(mQuery, mSource, orientationFor(aspect)));
      }
    } catch { /* noop */ }
    finally { setMLoading(false); }
  };

  const addClip = (media: Media, narration = "", query = mQuery) => {
    const c: Clip = { id: uid(), media, narration, query, visual: query, seconds: 5, startSec: 0, transition: "fade", effect: media.type === "photo" ? "zoom" : "none" };
    setClips((p) => [...p, c]);
    setSelectedId(c.id);
  };

  const importQueue = () => {
    let q: Media[] = [];
    try { q = JSON.parse(localStorage.getItem(PRODUCTION_QUEUE) || "[]"); } catch {}
    if (q.length === 0) return;
    const add: Clip[] = q.filter((m) => m?.url).map((m) => ({ id: uid(), media: { type: m.type, thumb: m.thumb, url: m.url }, narration: "", query: "", visual: "", seconds: 5, startSec: 0, transition: "fade", effect: m.type === "photo" ? "zoom" : "none" }));
    setClips((p) => [...p, ...add]);
    try { localStorage.setItem(PRODUCTION_QUEUE, "[]"); } catch {}
    setQueueCount(0);
  };

  /* ── Edición de clips ── */
  const updateClip = (id: string, patch: Partial<Clip>) => setClips((p) => p.map((c) => c.id === id ? { ...c, ...patch } : c));
  const removeClip = (id: string) => { setClips((p) => p.filter((c) => c.id !== id)); if (selectedId === id) setSelectedId(null); };
  const moveClip = (id: string, dir: -1 | 1) => setClips((p) => {
    const i = p.findIndex((c) => c.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= p.length) return p;
    const n = [...p]; [n[i], n[j]] = [n[j], n[i]]; return n;
  });
  const reSearch = async (id: string, query: string) => {
    updateClip(id, { loadingMedia: true });
    const c0 = clips.find((c) => c.id === id);
    const cands = await sceneMedia(query, c0?.visual || query, orientationFor(aspect));
    const used = new Set(clips.filter((c) => c.id !== id).map((c) => c.media?.url).filter(Boolean) as string[]);
    const cur = clips.find((c) => c.id === id)?.media?.url;
    const pick = cands.find((m) => !used.has(m.url) && m.url !== cur) ?? cands.find((m) => !used.has(m.url)) ?? cands[0];
    updateClip(id, { media: pick, loadingMedia: false });
  };

  /* ── Voz / preview (Google TTS gratis) ── */
  const speak = useCallback(async (text: string) => {
    if (!voice || !text?.trim()) return;
    try {
      const r = await fetch("/api/admin/editor/tts", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": secret }, body: JSON.stringify({ text, lang: voiceCode }) });
      if (!r.ok) return;
      const blob = await r.blob();
      const a = audioRef.current; if (!a) return;
      a.src = URL.createObjectURL(blob);
      a.play().catch(() => {});
    } catch { /* noop */ }
  }, [voice, voiceCode, secret]);

  const stopPreview = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (audioRef.current) { try { audioRef.current.pause(); } catch { /* noop */ } }
    setPreviewIndex(-1);
  }, []);

  // Reparte la duración del audio entre los clips para cuadrar exacto.
  const fitToAudio = (dur: number) => setClips((prev) => {
    const n = prev.length;
    if (n === 0 || dur < 2) return prev;
    let base = Math.min(Math.max(Math.floor(dur / n), 2), 60);
    let rem = dur - base * n;
    return prev.map((c) => {
      let sec = base;
      if (rem > 0 && base < 60) { sec += 1; rem -= 1; }
      return { ...c, seconds: sec };
    });
  });

  const onAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) { setError("Sube un archivo de audio (mp3, wav, m4a, ogg)."); return; }
    if (file.size > 25 * 1024 * 1024) { setError("El audio supera 25 MB."); return; }
    setError(null);
    if (customAudio?.url) { try { URL.revokeObjectURL(customAudio.url); } catch { /* noop */ } }
    const url = URL.createObjectURL(file);
    setCustomAudio({ name: file.name, file, url });
    const probe = new Audio();
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const d = Math.round(probe.duration) || 0;
      setCustomAudioDur(d);
      if (d >= 2) fitToAudio(d); // ajusta los clips al audio automáticamente
    };
    probe.src = url;
  };
  const clearCustomAudio = () => {
    if (customAudio?.url) { try { URL.revokeObjectURL(customAudio.url); } catch { /* noop */ } }
    setCustomAudio(null);
    setCustomAudioDur(0);
    if (audioFileRef.current) audioFileRef.current.value = "";
  };

  useEffect(() => {
    if (previewIndex < 0) return;
    if (previewIndex >= clips.length) { stopPreview(); return; }
    const c = clips[previewIndex];
    if (customAudio) {
      if (previewIndex === 0 && audioRef.current) { audioRef.current.src = customAudio.url; audioRef.current.play().catch(() => {}); }
    } else {
      speak(c.narration);
    }
    timerRef.current = setTimeout(() => setPreviewIndex((i) => i + 1), c.seconds * 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [previewIndex, clips, speak, stopPreview, customAudio]);
  useEffect(() => () => stopPreview(), [stopPreview]);

  const renderMp4 = async () => {
    stopPreview();
    setRendering(true); setRenderPct(0); setRenderMsg("Iniciando…"); setError(null);
    try {
      const { renderVideo } = await import("@/lib/ai/render-video");
      let opts: { ttsLang?: string; customAudio?: Uint8Array; customAudioExt?: string };
      if (customAudio) {
        const bytes = new Uint8Array(await customAudio.file.arrayBuffer());
        const ext = (customAudio.name.split(".").pop() || "mp3").toLowerCase();
        opts = { customAudio: bytes, customAudioExt: ext };
      } else {
        opts = { ttsLang: voice ? voiceCode : undefined };
      }
      const blob = await renderVideo(
        clips.map((c) => ({ seconds: c.seconds, media: c.media, effect: c.effect, startSec: c.startSec, narration: c.narration })),
        aspect, secret, (msg, pct) => { setRenderMsg(msg); setRenderPct(pct); },
        opts,
      );
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `mpp-video-${Date.now()}.mp4`; a.click();
    } catch (e) { setError(e instanceof Error ? e.message : "Error al renderizar"); }
    finally { setRendering(false); }
  };

  if (!authed) {
    return (
      <AdminShell title="Mega Editor de Video IA" description="Crea videos largos con IA estilo CapCut. Solo SuperAdmin." icon={Clapperboard} iconGradient="from-violet-500 to-fuchsia-600" status="beta" breadcrumb={[{ label: "Mega Editor" }]}>
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

  const cur = previewIndex >= 0 ? clips[previewIndex] : null;
  const pxPerSec = 16;

  return (
    <AdminShell title="Mega Editor de Video IA" description="Estilo CapCut: IA + Banco de Medios → timeline editable → preview → render MP4. Solo SuperAdmin." icon={Clapperboard} iconGradient="from-violet-500 to-fuchsia-600" status="beta" breadcrumb={[{ label: "Mega Editor" }]}>
      <div className="grid lg:grid-cols-[360px_1fr] gap-4">
        {/* ════ Panel izquierdo ════ */}
        <div className="space-y-3">
          {/* Panel: Crear con IA (prompt) — siempre visible */}
          <div className="glass-card rounded-2xl border border-violet-500/25 p-4 space-y-3">
            <h3 className="flex items-center gap-1.5 text-white font-bold text-sm"><Wand2 className="w-4 h-4 text-violet-400" /> Crear con IA — escribe tu idea</h3>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Idea / Tema del video (prompt)</label>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="Ej: La historia del café, estilo documental" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/40 resize-none" />
              </div>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Duración</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {DURATIONS.map((d) => <button key={d.v} onClick={() => setDuration(d.v)} className={`py-2 rounded-lg text-[11px] font-bold transition-all ${duration === d.v ? "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white" : "bg-white/5 border border-white/10 text-white/60 hover:text-white"}`}>{d.label}</button>)}
                </div>
              </div>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Fuente de medios</label>
                <select value={genSource} onChange={(e) => setGenSource(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/40">
                  {GEN_SOURCES.map((s) => <option key={s.v} value={s.v} className="bg-[#0f1219]">{s.label}</option>)}
                </select>
                <p className="text-white/35 text-[10px] mt-1"><b>Mixto</b> combina todas las fuentes por escena (Pexels → Wikimedia → IA), así ninguna queda vacía. Para <b>personajes/historias</b> específicas, <b>NVIDIA · Imágenes IA</b> da el visual más fiel.</p>
              </div>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Formato</label>
                <select value={aspect} onChange={(e) => setAspect(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/40">
                  {ASPECTS.map((a) => <option key={a.v} value={a.v} className="bg-[#0f1219]">{a.label}</option>)}
                </select>
              </div>
              <button onClick={() => setVoice((v) => !v)} className={`w-full inline-flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${voice ? "bg-violet-500/15 border-violet-500/30 text-violet-200" : "bg-white/5 border-white/10 text-white/50"}`}>
                {voice ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />} Narración con voz {voice ? "ON" : "OFF"}
              </button>
              {voice && (
                <div>
                  <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Voz del narrador (idioma + acento)</label>
                  <div className="flex gap-2">
                    <select value={voiceCode} onChange={(e) => setVoiceCode(e.target.value)} className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/40">
                      {VOICE_OPTIONS.map((o) => <option key={o.v} value={o.v} className="bg-[#0f1219]">{o.label}</option>)}
                    </select>
                    <button type="button" onClick={() => speak(lang === "en" ? "This is the narrator voice preview." : "Esta es una prueba de la voz del narrador.")} className="inline-flex items-center gap-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-3 rounded-xl flex-shrink-0" title="Probar voz"><Volume2 className="w-3.5 h-3.5" /> Probar</button>
                  </div>
                  <p className="text-white/35 text-[10px] mt-1">El guión se genera en {lang === "en" ? "inglés" : "español"} y la voz va dentro del MP4 (gratis).</p>
                </div>
              )}
              {/* Audio propio (subir voz local) */}
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Tu voz (audio local)</label>
                <input ref={audioFileRef} type="file" accept="audio/*" onChange={onAudioFile} className="hidden" />
                {customAudio ? (
                  <>
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                      <span className="text-emerald-200 text-[11px] font-semibold truncate flex-1">{customAudio.name}</span>
                      <button type="button" onClick={() => { const a = audioRef.current; if (a) { a.src = customAudio.url; a.play().catch(() => {}); } }} className="text-white/70 hover:text-white" title="Escuchar"><Play className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={clearCustomAudio} className="text-white/60 hover:text-red-300" title="Quitar"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <p className="text-emerald-300/70 text-[10px] mt-1">✓ Se usará TU audio en el video (en vez de la voz TTS).</p>
                    {customAudioDur > 0 && (
                      <div className="flex items-center justify-between mt-1.5 gap-2">
                        <span className="text-white/45 text-[10px]">Audio: {Math.floor(customAudioDur / 60)}:{String(customAudioDur % 60).padStart(2, "0")} · Clips: {totalSec}s</span>
                        {clips.length > 0 && <button type="button" onClick={() => fitToAudio(customAudioDur)} className="text-[10px] font-bold text-violet-300 hover:text-violet-200">↔ Ajustar clips a mi audio</button>}
                      </div>
                    )}
                  </>
                ) : (
                  <button type="button" onClick={() => audioFileRef.current?.click()} className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70">
                    <Upload className="w-3.5 h-3.5" /> Subir mi voz (MP3/WAV/M4A)
                  </button>
                )}
              </div>
              <button onClick={generate} disabled={generating || !prompt.trim()} className="shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:opacity-95 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-violet-500/30 disabled:opacity-50">
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando…</> : <><Wand2 className="w-4 h-4" /> Generar storyboard</>}
              </button>
              {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>

          {/* Panel: Banco de Medios — siempre visible */}
          <div className="glass-card rounded-2xl border border-emerald-500/25 p-4 space-y-3">
              <h3 className="flex items-center gap-1.5 text-white font-bold text-sm"><Film className="w-4 h-4 text-emerald-400" /> Banco de Medios — busca y añade clips</h3>
              <div className="flex gap-1.5">
                {([["video", "Video"], ["photo", "Fotos"], ["wikimedia", "Wiki"], ["archive", "Archive"]] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setMSource(v)} className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${mSource === v ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" : "bg-white/5 border border-white/10 text-white/60 hover:text-white"}`}>{l}</button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); searchMedia(); }} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={mQuery} onChange={(e) => setMQuery(e.target.value)} placeholder="Buscar clips…" className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40" />
                </div>
                <button type="submit" disabled={mLoading} className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 rounded-xl disabled:opacity-50">{mLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</button>
              </form>
              {queueCount > 0 && (
                <button onClick={importQueue} className="w-full inline-flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold px-3 py-2 rounded-xl">
                  <FolderInput className="w-3.5 h-3.5 text-violet-400" /> Importar producción ({queueCount})
                </button>
              )}
              <div className="grid grid-cols-3 gap-1.5 max-h-[360px] overflow-y-auto scrollbar-hide">
                {mResults.map((m, i) => (
                  <button key={i} onClick={() => addClip(m)} className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    {m.type === "video" && <VideoIcon className="absolute bottom-1 left-1 w-3 h-3 text-white/80" />}
                  </button>
                ))}
                {mResults.length === 0 && <p className="col-span-3 text-white/35 text-[11px] text-center py-6">Busca y pulsa un clip para añadirlo al timeline.</p>}
              </div>
          </div>

          {/* Acciones de proyecto */}
          {clips.length > 0 && (
            <div className="glass-card rounded-2xl border border-white/10 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs"><span className="text-white/55">Clips</span><span className="text-white font-bold">{clips.length}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-white/55">Duración</span><span className="text-white font-bold">{totalSec}s</span></div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => (previewIndex >= 0 ? stopPreview() : setPreviewIndex(0))} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold px-3 py-2 rounded-lg">
                  {previewIndex >= 0 ? <><Square className="w-3.5 h-3.5" /> Detener</> : <><Play className="w-3.5 h-3.5" /> Reproducir</>}
                </button>
                <button onClick={renderMp4} disabled={rendering} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-60">
                  {rendering ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {renderPct}%</> : <><Download className="w-3.5 h-3.5" /> Render MP4</>}
                </button>
              </div>
              {rendering && <><div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-600 transition-all" style={{ width: `${renderPct}%` }} /></div><p className="text-white/45 text-[10px]">{renderMsg}</p></>}
              <p className="text-white/35 text-[10px] pt-1">Render en navegador {customAudio ? "con TU audio" : voice ? "con voz (Google TTS gratis)" : "(sin audio)"}. Mejor ≤ ~90s.</p>
            </div>
          )}
        </div>

        {/* ════ Centro: preview + timeline + inspector ════ */}
        <div className="space-y-4">
          {/* Preview */}
          <div className="glass-card rounded-2xl border border-white/10 p-3">
            <div className={`relative ${aspectCls} max-h-[55vh] mx-auto rounded-xl overflow-hidden bg-black border border-white/10`}>
              {cur ? (
                <div key={cur.id} className="absolute inset-0 animate-in fade-in duration-500">
                  {cur.media ? (cur.media.type === "video" ? (
                    <video src={cur.media.url} autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: cssFilter(cur.effect) }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cur.media.url} alt="" className="w-full h-full object-cover" style={{ filter: cssFilter(cur.effect), animation: cur.effect === "zoom" || cur.media.type === "photo" ? "kenburns 6s ease-out forwards" : undefined }} />
                  )) : <div className="w-full h-full bg-gradient-to-br from-violet-700 to-fuchsia-900" />}
                  {cur.narration && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4"><p className="text-white text-sm sm:text-base font-semibold text-center drop-shadow">{cur.narration}</p></div>}
                  <div className="absolute top-2 right-2 text-[10px] font-bold bg-black/50 text-white px-2 py-0.5 rounded backdrop-blur">{previewIndex + 1}/{clips.length}</div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <Film className="w-10 h-10 text-white/20 mb-3" />
                  <p className="text-white/45 text-sm">{clips.length > 0 ? "Pulsa Reproducir para previsualizar." : "Genera con IA o añade clips del Banco de Medios."}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline (estilo CapCut) */}
          {clips.length > 0 && (
            <div className="glass-card rounded-2xl border border-white/10 p-3">
              <p className="text-white/55 text-[10px] font-bold uppercase tracking-wider mb-2">Línea de producción</p>
              <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2">
                {clips.map((c, i) => (
                  <button key={c.id} onClick={() => setSelectedId(c.id)} style={{ width: Math.max(56, c.seconds * pxPerSec) }}
                    className={`relative h-16 rounded-lg overflow-hidden border flex-shrink-0 transition-all ${selectedId === c.id ? "border-violet-400 ring-2 ring-violet-500/40" : "border-white/10 hover:border-white/30"}`}>
                    {c.media ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.media.thumb} alt="" className="w-full h-full object-cover" style={{ filter: cssFilter(c.effect) }} />
                    ) : c.loadingMedia ? <div className="w-full h-full flex items-center justify-center bg-black"><Loader2 className="w-4 h-4 animate-spin text-white/40" /></div> : <div className="w-full h-full bg-gradient-to-br from-violet-700 to-fuchsia-900" />}
                    <span className="absolute bottom-0.5 left-0.5 text-[9px] font-bold bg-black/60 text-white px-1 rounded">{c.seconds}s</span>
                    <span className="absolute top-0.5 left-0.5 text-[9px] font-bold text-white/80">{i + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inspector del clip seleccionado */}
          {selected && (
            <div className="glass-card rounded-2xl border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-white font-bold text-sm">Editar clip</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveClip(selected.id, -1)} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/70" title="Mover izquierda"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <button onClick={() => moveClip(selected.id, 1)} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/70" title="Mover derecha"><ChevronRight className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeClip(selected.id)} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/15 hover:border-red-500/30 flex items-center justify-center text-white/60 hover:text-red-300" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <textarea value={selected.narration} onChange={(e) => updateClip(selected.id, { narration: e.target.value })} rows={2} placeholder="Texto / narración del clip…" className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-violet-500/40 resize-none" />
              <div className="flex items-center gap-2 flex-wrap">
                <input value={selected.query} onChange={(e) => updateClip(selected.id, { query: e.target.value })} placeholder="palabras clave" className="flex-1 min-w-[120px] bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white/80 focus:outline-none focus:border-violet-500/40" />
                <button onClick={() => reSearch(selected.id, selected.query)} className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[11px] px-2 py-1.5 rounded-lg" title="Buscar otro clip">{selected.loadingMedia ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-white/45 text-[9px] font-bold uppercase mb-1">Efecto</label>
                  <select value={selected.effect} onChange={(e) => updateClip(selected.id, { effect: e.target.value as Effect })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none">
                    {EFFECTS.map((e) => <option key={e.v} value={e.v} className="bg-[#0f1219]">{e.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-white/45 text-[9px] font-bold uppercase mb-1">Transición</label>
                  <select value={selected.transition} onChange={(e) => updateClip(selected.id, { transition: e.target.value as Transition })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none">
                    <option value="fade" className="bg-[#0f1219]">Fade</option><option value="zoom" className="bg-[#0f1219]">Zoom</option><option value="slide" className="bg-[#0f1219]">Slide</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/45 text-[9px] font-bold uppercase mb-1">Duración (s)</label>
                  <input type="number" min={2} max={60} value={selected.seconds} onChange={(e) => updateClip(selected.id, { seconds: Math.min(Math.max(+e.target.value || 4, 2), 60) })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-white/45 text-[9px] font-bold uppercase mb-1">Recorte inicio (s)</label>
                  <input type="number" min={0} max={60} value={selected.startSec} disabled={selected.media?.type !== "video"} onChange={(e) => updateClip(selected.id, { startSec: Math.max(0, +e.target.value || 0) })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none disabled:opacity-40" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
      <style>{`@keyframes kenburns{from{transform:scale(1.05)}to{transform:scale(1.18)}}`}</style>
    </AdminShell>
  );
}
