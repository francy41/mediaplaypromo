"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clapperboard, Lock, Wand2, Loader2, Play, Square, Download, Trash2, RefreshCw,
  Video as VideoIcon, Volume2, VolumeX, Film, Search, Plus,
  ChevronLeft, ChevronRight, FolderInput, Upload, X, Music, Subtitles, Mic,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { MUAPI_MODELS } from "@/lib/ai/muapi-models";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SECRET_STORE = "mpp_license_admin_secret";
const PRODUCTION_QUEUE = "mpp_production_queue";
type Transition = "fade" | "zoom" | "slide";
type Effect = "none" | "bw" | "blur" | "bright" | "zoom" | "warm" | "cold" | "vintage" | "vivid";

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
  narrationDur?: number; // duración medida de la voz (seg) para ver si el clip cuadra
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
const SOURCE_DEFS = [
  { id: "muapi", label: "MUAPI (video IA)" },
  { id: "pexels-video", label: "Pexels Video" },
  { id: "pixabay-video", label: "Pixabay Video" },
  { id: "pexels-photo", label: "Pexels Fotos" },
  { id: "pixabay-photo", label: "Pixabay Fotos" },
  { id: "wikimedia", label: "Wikimedia" },
  { id: "archive", label: "Archive" },
  { id: "nvidia", label: "NVIDIA IA" },
];
const SOURCE_ORDER = ["muapi", "pexels-video", "pixabay-video", "wikimedia", "archive", "pexels-photo", "pixabay-photo", "nvidia"]; // prioridad de la cadena por escena
const EFFECTS: { v: Effect; label: string }[] = [
  { v: "none", label: "Sin efecto" }, { v: "zoom", label: "Zoom (Ken Burns)" },
  { v: "bw", label: "Blanco y negro" }, { v: "blur", label: "Desenfoque" }, { v: "bright", label: "Brillo+" },
  { v: "warm", label: "Color cálido" }, { v: "cold", label: "Color frío" }, { v: "vintage", label: "Vintage" }, { v: "vivid", label: "Vívido" },
];

// Voces. "es/en…" = Google TTS gratis. "mx:<voiceId>" = voz natural MUAPI (usa créditos).
const VOICE_OPTIONS = [
  { v: "es", label: "🆓 Español (España) · Google" },
  { v: "es-us", label: "🆓 Español (Latam) · Google" },
  { v: "en", label: "🆓 English (US) · Google" },
  { v: "en-gb", label: "🆓 English (UK) · Google" },
  { v: "en-au", label: "🆓 English (AU) · Google" },
  { v: "mx:Spanish_SereneWoman", label: "⭐ Español · Serena (F) · MUAPI" },
  { v: "mx:Spanish_ThoughtfulMan", label: "⭐ Español · Reflexivo (M) · MUAPI" },
  { v: "mx:Spanish_Kind-heartedGirl", label: "⭐ Español · Amable (F) · MUAPI" },
  { v: "mx:Spanish_ReservedYoungMan", label: "⭐ Español · Joven (M) · MUAPI" },
  { v: "mx:Spanish_PassionateWarrior", label: "⭐ Español · Enérgico (M) · MUAPI" },
  { v: "mx:English_Graceful_Lady", label: "⭐ English · Graceful (F) · MUAPI" },
  { v: "mx:English_Trustworthy_Man", label: "⭐ English · Trustworthy (M) · MUAPI" },
];

const cssFilter = (e: Effect) =>
  e === "bw" ? "grayscale(1)"
  : e === "blur" ? "blur(3px)"
  : e === "bright" ? "brightness(1.2) saturate(1.25)"
  : e === "warm" ? "sepia(0.3) saturate(1.3) brightness(1.03)"
  : e === "cold" ? "saturate(1.1) hue-rotate(-12deg) brightness(1.03)"
  : e === "vintage" ? "sepia(0.4) contrast(1.1) saturate(0.9)"
  : e === "vivid" ? "saturate(1.6) contrast(1.12)"
  : "none";
const uid = () => `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const PX_PER_SEC = 18; // escala de la línea de producción (px por segundo)
const EFFECT_SHORT: Record<string, string> = { zoom: "Zoom", bw: "B/N", blur: "Blur", bright: "Brillo", warm: "Cálido", cold: "Frío", vintage: "Vintage", vivid: "Vívido" };

// Reduce una imagen a máx N px (para describirla rápido con la IA de visión).
function downscale(file: File, max = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("img error"));
    img.src = URL.createObjectURL(file);
  });
}

export default function EditorPage() {
  const [secret, setSecret] = useState("");
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // IA
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(60);
  const [aspect, setAspect] = useState("16:9");
  const [sources, setSources] = useState<Record<string, boolean>>({ "muapi": false, "pexels-video": true, "pixabay-video": false, "pexels-photo": false, "pixabay-photo": false, "wikimedia": true, "archive": false, "nvidia": true });
  const toggleSource = (id: string) => setSources((s) => ({ ...s, [id]: !s[id] }));
  const [muapiModel, setMuapiModel] = useState("wan2.2-5b-fast-t2v");
  const [voice, setVoice] = useState(true);
  const [voiceCode, setVoiceCode] = useState("es");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [customAudio, setCustomAudio] = useState<{ name: string; file: File; url: string } | null>(null);
  const [customAudioDur, setCustomAudioDur] = useState(0);
  const [measuringVoices, setMeasuringVoices] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState("");
  const voiceUrlsRef = useRef<Record<string, string>>({});
  const [wavePeaks, setWavePeaks] = useState<number[] | null>(null); // onda del audio subido
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [aligning, setAligning] = useState(false);
  const audioFileRef = useRef<HTMLInputElement | null>(null);
  const [refImages, setRefImages] = useState<{ name: string; url: string; desc: string }[]>([]);
  const [refLoading, setRefLoading] = useState(false);
  const refFileRef = useRef<HTMLInputElement | null>(null);
  const subFileRef = useRef<HTMLInputElement | null>(null);
  const refDesc = refImages.map((r) => r.desc).filter(Boolean).join(". "); // descripciones combinadas → guían NVIDIA
  const [subtitles, setSubtitles] = useState(false);
  const [transitions, setTransitions] = useState(true);
  const [transitionStyle, setTransitionStyle] = useState<"fade" | "xfade">("fade");
  const [musicFile, setMusicFile] = useState<{ name: string; file: File } | null>(null);
  const [musicVol, setMusicVol] = useState(0.22);
  const musicRef = useRef<HTMLInputElement | null>(null);
  const muapiErrRef = useRef<string>("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // timeline
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [bulkEffect, setBulkEffect] = useState<Effect>("none");
  const [bulkTransition, setBulkTransition] = useState<Transition>("fade");
  const [flash, setFlash] = useState("");

  // media browser
  const [mSource, setMSource] = useState<"video" | "photo" | "archive" | "wikimedia" | "pixabay-video" | "pixabay-photo">("video");
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
    let qc = 0; try { qc = (JSON.parse(localStorage.getItem(PRODUCTION_QUEUE) || "[]") as Media[]).length; } catch {}
    const t = setTimeout(() => {
      if (s) { setSecret(s); setAuthed(true); }
      setQueueCount(qc);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const lang: "es" | "en" = (voiceCode.startsWith("es") || voiceCode.toLowerCase().includes("spanish")) ? "es" : "en";
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

  const pixabay = useCallback(async (query: string, type: "video" | "photo", orientation: string): Promise<Media[]> => {
    try {
      const r = await fetch(`/api/admin/stock?q=${encodeURIComponent(query)}&source=pixabay&type=${type}&orientation=${orientation}`, { headers: { "x-admin-secret": secret } });
      const d = await r.json();
      return (d.results ?? []).filter((m: Media) => m?.url).map((m: { thumb: string; url: string }) => ({ type, thumb: m.thumb, url: m.url }));
    } catch { return []; }
  }, [secret]);

  const wikimedia = useCallback(async (query: string): Promise<Media[]> => {
    try {
      const r = await fetch(`/api/admin/stock?q=${encodeURIComponent(query)}&source=wikimedia`, { headers: { "x-admin-secret": secret } });
      const d = await r.json();
      return (d.results ?? []).filter((m: { url?: string }) => m.url).map((m: { thumb: string; url: string }) => ({ type: "video" as const, thumb: m.thumb, url: m.url }));
    } catch { return []; }
  }, [secret]);

  const archive = useCallback(async (query: string): Promise<Media[]> => {
    try {
      const r = await fetch(`/api/admin/stock?q=${encodeURIComponent(query)}&source=archive&media=video`, { headers: { "x-admin-secret": secret } });
      const d = await r.json();
      return (d.results ?? []).filter((m: { thumb?: string }) => m.thumb).map((m: { thumb: string }) => ({ type: "photo" as const, thumb: m.thumb, url: m.thumb }));
    } catch { return []; }
  }, [secret]);

  const muapiVideo = useCallback(async (prompt: string): Promise<Media | undefined> => {
    try {
      const r = await fetch("/api/ai/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "muapi", model: muapiModel, prompt, aspect_ratio: aspect, duration: /^veo/i.test(muapiModel) ? 8 : 5 }) });
      const job = await r.json();
      if (job.error || !job.id) {
        const code = job?.details?.error?.code;
        muapiErrRef.current = code === "INSUFFICIENT_CREDITS"
          ? "Sin saldo en MUAPI. Recarga en muapi.ai/topup para generar video IA real."
          : String(job?.details?.detail || job?.error || "MUAPI no disponible");
        return undefined;
      }
      const OK = ["completed", "succeeded"];
      if (OK.includes(job.status)) {
        const u0 = Array.isArray(job.output) ? job.output[0] : job.output;
        if (u0) return { type: "video", thumb: u0, url: u0 };
      }
      for (let i = 0; i < 120; i++) {
        await sleep(3000);
        const sr = await fetch(`/api/ai/status/${encodeURIComponent(job.id)}`);
        const st = await sr.json().catch(() => ({}));
        if (OK.includes(st.status)) {
          const url = (Array.isArray(st.output) ? st.output[0] : st.output) || (Array.isArray(st.urls) ? st.urls[0] : st.result_url);
          return url ? { type: "video", thumb: url, url } : undefined;
        }
        if (["failed", "cancelled", "canceled"].includes(st.status)) return undefined;
      }
      return undefined;
    } catch { return undefined; }
  }, [muapiModel, aspect]);

  const nvidiaImage = useCallback(async (p: string, refDescription?: string): Promise<Media | undefined> => {
    try {
      const prompt = refDescription ? `${refDescription}. ${p}` : p;
      const r = await fetch("/api/ai/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "nvidia", model: "black-forest-labs/flux.1-schnell", prompt, width: 1024, height: 1024 }) });
      const d = await r.json();
      const url = d.output?.[0];
      return url ? { type: "photo", thumb: url, url } : undefined;
    } catch { return undefined; }
  }, []);

  const sceneMedia = useCallback(async (query: string, visual: string, orientation: string): Promise<Media[]> => {
    // Recorre las fuentes SELECCIONADAS en orden de prioridad y devuelve el primer clip encontrado.
    for (const sid of SOURCE_ORDER) {
      if (!sources[sid]) continue;
      if (sid === "muapi") { const v = await muapiVideo(visual || query); if (v) return [v]; continue; }
      if (sid === "nvidia") { const m = await nvidiaImage(visual || query, refDesc); if (m) return [m]; continue; }
      if (sid === "wikimedia") { const w = await wikimedia(query); if (w.length) return w; continue; }
      if (sid === "archive") { const a = await archive(query); if (a.length) return a; continue; }
      if (sid === "pixabay-video" || sid === "pixabay-photo") {
        const px = await pixabay(query, sid === "pixabay-photo" ? "photo" : "video", orientation);
        if (px.length) return px; continue;
      }
      const type = sid === "pexels-photo" ? "photo" : "video";
      const p = await pexels(query, type, orientation);
      if (p.length) return p;
    }
    return [];
  }, [sources, pexels, pixabay, wikimedia, archive, nvidiaImage, muapiVideo, refDesc]);

  /* ── Generar storyboard (IA) ── */
  const generate = async () => {
    if (!prompt.trim()) return;
    stopPreview();
    setGenerating(true); setError(null); setClips([]); setSelectedId(null); muapiErrRef.current = "";
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
      if (sources.muapi && muapiErrRef.current) setError(`⚠️ MUAPI: ${muapiErrRef.current} Las escenas usaron las demás fuentes marcadas.`);
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
      } else if (mSource === "pixabay-video" || mSource === "pixabay-photo") {
        setMResults(await pixabay(mQuery, mSource === "pixabay-photo" ? "photo" : "video", orientationFor(aspect)));
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
    type QItem = Media & { narration?: string; seconds?: number };
    let q: QItem[] = [];
    try { q = JSON.parse(localStorage.getItem(PRODUCTION_QUEUE) || "[]"); } catch {}
    if (q.length === 0) return;
    const add: Clip[] = q.filter((m) => m?.url).map((m) => ({ id: uid(), media: { type: m.type, thumb: m.thumb, url: m.url }, narration: m.narration || "", query: "", visual: "", seconds: m.seconds || 5, startSec: 0, transition: "fade", effect: m.type === "photo" ? "zoom" : "none" }));
    setClips((p) => [...p, ...add]);
    // Meta del Estudio: aplica la voz y el formato elegidos allí.
    try {
      const meta = JSON.parse(localStorage.getItem("mpp_studio_meta") || "null") as { voice?: string; aspect?: string } | null;
      if (meta?.voice) setVoiceCode(meta.voice);
      if (meta?.aspect) setAspect(meta.aspect);
      localStorage.removeItem("mpp_studio_meta");
    } catch {}
    try { localStorage.setItem(PRODUCTION_QUEUE, "[]"); } catch {}
    setQueueCount(0);
  };

  // Auto-importa la producción del Estudio al abrir el editor.
  useEffect(() => {
    let flag = ""; try { flag = localStorage.getItem("mpp_studio_autoimport") || ""; } catch {}
    if (flag !== "1") return;
    try { localStorage.removeItem("mpp_studio_autoimport"); } catch {}
    const t = setTimeout(() => importQueue(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Edición de clips ── */
  const updateClip = (id: string, patch: Partial<Clip>) => setClips((p) => p.map((c) => c.id === id ? { ...c, ...patch } : c));
  const applyToAll = () => {
    setClips((p) => p.map((c) => ({ ...c, effect: bulkEffect, transition: bulkTransition })));
    const lbl = EFFECTS.find((e) => e.v === bulkEffect)?.label ?? bulkEffect;
    setFlash(`✓ ${lbl} + ${bulkTransition} aplicado a ${clips.length} clips`);
    setTimeout(() => setFlash(""), 2600);
  };

  // Recorte por arrastre del ratón en la timeline.
  const startTrim = (e: React.PointerEvent, clip: Clip, edge: "left" | "right") => {
    e.stopPropagation();
    const startX = e.clientX;
    const baseSec = clip.seconds;
    const baseStart = clip.startSec;
    const onMove = (ev: PointerEvent) => {
      const d = Math.round((ev.clientX - startX) / PX_PER_SEC);
      if (edge === "right") updateClip(clip.id, { seconds: Math.min(Math.max(baseSec + d, 2), 60) });
      else updateClip(clip.id, { startSec: Math.max(0, baseStart + d), seconds: Math.min(Math.max(baseSec - d, 2), 60) });
    };
    const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };
  const removeClip = (id: string) => { setClips((p) => p.filter((c) => c.id !== id)); if (selectedId === id) setSelectedId(null); };
  const moveClip = (id: string, dir: -1 | 1) => setClips((p) => {
    const i = p.findIndex((c) => c.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= p.length) return p;
    const n = [...p]; [n[i], n[j]] = [n[j], n[i]]; return n;
  });
  // Genera la voz de cada escena, mide su duración y ajusta el clip para que quepa.
  const measureVoices = async () => {
    const list = clips.filter((c) => (c.narration || "").trim());
    if (list.length === 0) { setFlash("No hay narración en las escenas."); setTimeout(() => setFlash(""), 2000); return; }
    setMeasuringVoices(true);
    try {
      for (let idx = 0; idx < list.length; idx++) {
        const c = list[idx];
        setVoiceMsg(`Midiendo voz ${idx + 1}/${list.length}…`);
        try {
          const ttsBody = voiceCode.startsWith("mx:") ? { text: c.narration, voice: voiceCode } : { text: c.narration, lang: voiceCode };
          const r = await fetch("/api/admin/editor/tts", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": secret }, body: JSON.stringify(ttsBody) });
          if (!r.ok) continue;
          const buf = await r.arrayBuffer();
          let dur = 0;
          try { const ctx = new AudioContext(); const dec = await ctx.decodeAudioData(buf.slice(0)); dur = dec.duration; ctx.close(); } catch {}
          if (dur > 0.2) {
            try { const old = voiceUrlsRef.current[c.id]; if (old) URL.revokeObjectURL(old); } catch {}
            voiceUrlsRef.current[c.id] = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
            setClips((prev) => prev.map((x) => x.id === c.id ? { ...x, narrationDur: dur, seconds: Math.min(60, Math.max(x.seconds, Math.ceil(dur + 0.4))) } : x));
          }
        } catch { /* siguiente */ }
      }
      setVoiceMsg("✓ Voces medidas · clips ajustados a la voz");
      setTimeout(() => setVoiceMsg(""), 3000);
    } finally { setMeasuringVoices(false); }
  };

  // Dibuja la onda del audio en el canvas de la pista.
  useEffect(() => {
    const cv = waveCanvasRef.current;
    if (!cv || !wavePeaks || wavePeaks.length === 0) return;
    const w = Math.max(64, Math.round(customAudioDur * PX_PER_SEC)), h = 44;
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(16,185,129,0.75)";
    const n = wavePeaks.length, bw = w / n;
    for (let i = 0; i < n; i++) { const ph = Math.max(1, wavePeaks[i] * (h - 4)); ctx.fillRect(i * bw, (h - ph) / 2, Math.max(1, bw - 0.4), ph); }
  }, [wavePeaks, customAudioDur]);

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
      const ttsBody = voiceCode.startsWith("mx:") ? { text, voice: voiceCode } : { text, lang: voiceCode };
      const r = await fetch("/api/admin/editor/tts", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": secret }, body: JSON.stringify(ttsBody) });
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
  // Reparte la duración del audio entre los clips PROPORCIONAL a la longitud de
  // cada narración (más texto → más tiempo). Aproxima el ritmo del habla → mejor sync.
  const fitToAudio = (dur: number) => setClips((prev) => {
    const n = prev.length;
    if (n === 0 || dur < 2) return prev;
    const weights = prev.map((c) => Math.max((c.narration || "").trim().length, 8));
    const totalW = weights.reduce((a, b) => a + b, 0);
    const secs = weights.map((w) => Math.min(Math.max(Math.round((dur * w) / totalW), 2), 60));
    // Ajusta para cuadrar EXACTAMENTE con la duración del audio.
    let diff = dur - secs.reduce((a, b) => a + b, 0);
    let guard = 0;
    while (diff !== 0 && guard++ < 5000) {
      const before = diff;
      for (let i = 0; i < n && diff !== 0; i++) {
        if (diff > 0 && secs[i] < 60) { secs[i]++; diff--; }
        else if (diff < 0 && secs[i] > 2) { secs[i]--; diff++; }
      }
      if (diff === before) break; // todos en su límite
    }
    return prev.map((c, i) => ({ ...c, seconds: secs[i] }));
  });

  // Sync EXACTO: alinea TU audio (ElevenLabs) con el guión → duración real por escena.
  const alignWithElevenLabs = async () => {
    if (!customAudio || clips.length === 0) return;
    const narrations = clips.map((c) => (c.narration || "").trim());
    if (narrations.every((s) => !s)) { setError("Las escenas no tienen narración para alinear."); return; }
    setAligning(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", customAudio.file, customAudio.name);
      fd.append("narrations", JSON.stringify(narrations));
      const r = await fetch("/api/admin/editor/align", { method: "POST", headers: { "x-admin-secret": secret }, body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.error) { setError(`Sync ElevenLabs: ${d.error || r.status}`); return; }
      const durations: number[] = d.durations || [];
      setClips((prev) => prev.map((c, i) => (durations[i] ? { ...c, seconds: Math.min(Math.max(durations[i], 2), 60) } : c)));
      setFlash(`🎯 Sincronizado con tu voz (${d.totalSec}s) — escenas cuadradas con la locución`);
      setTimeout(() => setFlash(""), 3200);
    } catch { setError("Error de conexión al alinear."); }
    finally { setAligning(false); }
  };

  const onAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) { setError("Sube un archivo de audio (mp3, wav, m4a, ogg)."); return; }
    if (file.size > 25 * 1024 * 1024) { setError("El audio supera 25 MB."); return; }
    setError(null);
    if (customAudio?.url) { try { URL.revokeObjectURL(customAudio.url); } catch { /* noop */ } }
    const url = URL.createObjectURL(file);
    setCustomAudio({ name: file.name, file, url });
    // Duración + onda (para la pista visible en la timeline).
    (async () => {
      try {
        const buf = await file.arrayBuffer();
        const ctx = new AudioContext();
        const dec = await ctx.decodeAudioData(buf.slice(0));
        const d = Math.round(dec.duration) || 0;
        setCustomAudioDur(d);
        if (d >= 2) fitToAudio(d);
        const data = dec.getChannelData(0);
        const N = 800, block = Math.floor(data.length / N) || 1;
        const peaks: number[] = [];
        for (let i = 0; i < N; i++) { let mx = 0; for (let j = 0; j < block; j++) { const v = Math.abs(data[i * block + j] || 0); if (v > mx) mx = v; } peaks.push(mx); }
        setWavePeaks(peaks);
        ctx.close();
      } catch {
        const probe = new Audio(); probe.preload = "metadata";
        probe.onloadedmetadata = () => { const d = Math.round(probe.duration) || 0; setCustomAudioDur(d); if (d >= 2) fitToAudio(d); };
        probe.src = url;
      }
    })();
  };
  const clearCustomAudio = () => {
    if (customAudio?.url) { try { URL.revokeObjectURL(customAudio.url); } catch { /* noop */ } }
    setCustomAudio(null);
    setCustomAudioDur(0);
    setWavePeaks(null);
    if (audioFileRef.current) audioFileRef.current.value = "";
  };

  // Varias imágenes de referencia: reduce, describe (best-effort) y guarda.
  const onRefImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setError(null); setRefLoading(true);
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) { setError("Alguna imagen superaba 10 MB y se omitió."); continue; }
      try {
        const small = await downscale(file, 512);
        setRefImages((prev) => [...prev, { name: file.name, url: small, desc: "" }]);
        try {
          const r = await fetch("/api/admin/editor/describe", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": secret }, body: JSON.stringify({ image: small }) });
          const d = await r.json();
          if (d.description) setRefImages((prev) => prev.map((x) => (x.url === small ? { ...x, desc: d.description } : x)));
        } catch { /* la descripción es opcional */ }
      } catch { /* salta esta imagen */ }
    }
    setRefLoading(false);
    if (refFileRef.current) refFileRef.current.value = "";
  };
  const removeRefImage = (url: string) => setRefImages((prev) => prev.filter((x) => x.url !== url));
  const clearRefImages = () => { setRefImages([]); if (refFileRef.current) refFileRef.current.value = ""; };
  const addRefToClip = (img: { url: string }) => addClip({ type: "photo", thumb: img.url, url: img.url }, "", "referencia");
  const addAllRefToClips = () => refImages.forEach((img) => addClip({ type: "photo", thumb: img.url, url: img.url }, "", "referencia"));

  // Subir las letras/subtítulos desde un .txt o .csv → una línea = una escena.
  const onSubtitleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/)
        .map((l) => (l.includes(",") ? l.split(",")[0] : l).replace(/^["']|["']$/g, "").trim())
        .filter(Boolean);
      if (!lines.length) { setError("El archivo no tiene texto."); return; }
      const mk = (t: string): Clip => ({ id: uid(), narration: t, query: t.split(/\s+/).slice(0, 4).join(" "), visual: t, seconds: 5, startSec: 0, transition: "fade", effect: "none" });
      setClips((prev) => {
        if (prev.length === 0) return lines.map(mk);
        const out = prev.map((c, i) => (lines[i] != null ? { ...c, narration: lines[i] } : c));
        for (let i = prev.length; i < lines.length; i++) out.push(mk(lines[i]));
        return out;
      });
      setSubtitles(true);
      setError(null);
      setFlash(`✓ ${lines.length} líneas cargadas como subtítulos`);
      setTimeout(() => setFlash(""), 2600);
    };
    reader.readAsText(file);
    if (subFileRef.current) subFileRef.current.value = "";
  };

  const onMusicFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) { setError("Sube un audio para la música."); return; }
    if (file.size > 25 * 1024 * 1024) { setError("La música supera 25 MB."); return; }
    setError(null); setMusicFile({ name: file.name, file });
  };
  const clearMusic = () => { setMusicFile(null); if (musicRef.current) musicRef.current.value = ""; };

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
      const opts: { ttsLang?: string; customAudio?: Uint8Array; customAudioExt?: string; music?: Uint8Array; musicExt?: string; musicVol?: number; subtitles?: boolean; transitions?: boolean; transitionStyle?: "fade" | "xfade" } = { subtitles, transitions, transitionStyle };
      if (customAudio) {
        opts.customAudio = new Uint8Array(await customAudio.file.arrayBuffer());
        opts.customAudioExt = (customAudio.name.split(".").pop() || "mp3").toLowerCase();
      } else if (voice) {
        opts.ttsLang = voiceCode;
      }
      if (musicFile) {
        opts.music = new Uint8Array(await musicFile.file.arrayBuffer());
        opts.musicExt = (musicFile.name.split(".").pop() || "mp3").toLowerCase();
        opts.musicVol = musicVol;
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
      <AdminShell title="Mega Editor de Video IA" description="Crea videos largos con IA estilo CapCut." icon={Clapperboard} iconGradient="from-violet-500 to-fuchsia-600" status="beta" breadcrumb={[{ label: "Mega Editor" }]}>
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

  return (
    <AdminShell title="Mega Editor de Video IA" description="Estilo CapCut: IA + Banco de Medios → timeline editable → preview → render MP4." icon={Clapperboard} iconGradient="from-violet-500 to-fuchsia-600" status="beta" breadcrumb={[{ label: "Mega Editor" }]}>
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
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Fuente de medios · marca las que quieras combinar</label>
                <div className="flex flex-wrap gap-1.5">
                  {SOURCE_DEFS.map((s) => (
                    <button key={s.id} type="button" onClick={() => toggleSource(s.id)} className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${sources[s.id] ? "bg-violet-500/20 border-violet-500/40 text-violet-200" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}>
                      {sources[s.id] ? "✓ " : ""}{s.label}
                    </button>
                  ))}
                </div>
                <p className="text-white/35 text-[10px] mt-1">Cada escena prueba las fuentes marcadas en orden (video real → IA) y usa la primera con resultado. Para <b>personajes/historias</b> marca <b>NVIDIA IA</b>.</p>
              </div>
              {sources.muapi && (
                <div>
                  <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Modelo MUAPI · video IA real</label>
                  <select value={muapiModel} onChange={(e) => setMuapiModel(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/40">
                    {Array.from(new Set(MUAPI_MODELS.video.map((m) => m.category))).map((cat) => (
                      <optgroup key={cat} label={cat} className="bg-[#0f1219]">
                        {MUAPI_MODELS.video.filter((m) => m.category === cat).map((m) => (
                          <option key={m.slug} value={m.slug} className="bg-[#0f1219]">{m.label} · {m.priceHint}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="text-amber-300/80 text-[10px] mt-1">⚠️ MUAPI genera <b>video IA real</b>, pero es <b>de pago</b> (gasta tu saldo MUAPI) y <b>tarda</b> (~30 s a varios min por escena). Empieza con <b>Wan 2.2 5B Fast</b> (~$0.02) para probar. Genera ~5 s por escena; el render lo ajusta a tu duración.</p>
                </div>
              )}
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Imágenes de referencia / locales (opcional)</label>
                <input ref={refFileRef} type="file" accept="image/*" multiple onChange={onRefImages} className="hidden" />
                {refImages.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    <div className="grid grid-cols-4 gap-1.5">
                      {refImages.map((img) => (
                        <div key={img.url} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10 bg-black">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt="ref" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeRefImage(img.url)} title="Quitar" className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-black rounded p-0.5 text-white/80 hover:text-red-300"><X className="w-3 h-3" /></button>
                          <button type="button" onClick={() => addRefToClip(img)} title="Añadir a clips" className="absolute bottom-0.5 right-0.5 bg-violet-600/85 hover:bg-violet-600 rounded p-0.5 text-white"><Plus className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {refLoading ? (
                        <span className="text-white/50 text-[10px] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Analizando…</span>
                      ) : refDesc && sources.nvidia ? (
                        <span className="text-violet-300/70 text-[10px] truncate">✓ {refImages.length} ref. guiarán la IA de NVIDIA</span>
                      ) : (
                        <span className="text-white/40 text-[10px]">{refImages.length} imagen(es) · pulsa + para añadir al clip</span>
                      )}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button type="button" onClick={addAllRefToClips} className="text-[10px] font-bold text-violet-300 hover:text-violet-200">+ Todas a clips</button>
                        <button type="button" onClick={clearRefImages} className="text-[10px] font-bold text-white/40 hover:text-red-300">Quitar todas</button>
                      </div>
                    </div>
                  </div>
                )}
                <button type="button" onClick={() => refFileRef.current?.click()} className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70">
                  <Upload className="w-3.5 h-3.5" /> Subir imágenes de referencia
                </button>
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
                  {clips.length > 0 && (
                    <button type="button" onClick={measureVoices} disabled={measuringVoices} className="w-full mt-2 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-60">
                      {measuringVoices ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {voiceMsg || "Midiendo…"}</> : <><Mic className="w-3.5 h-3.5" /> 🎙️ Medir voces y ajustar clips</>}
                    </button>
                  )}
                  {!measuringVoices && voiceMsg && <p className="text-cyan-300/80 text-[10px] mt-1">{voiceMsg}</p>}
                  <p className="text-white/35 text-[10px] mt-1">Mide la voz de cada escena y estira el clip para que quepa. En la línea de producción verás 🎙️ la duración (roja si el clip es más corto que su voz).</p>
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
                        {clips.length > 0 && <button type="button" onClick={() => fitToAudio(customAudioDur)} className="text-[10px] font-bold text-violet-300 hover:text-violet-200">↔ Ajustar (proporcional)</button>}
                      </div>
                    )}
                    {clips.length > 0 && (
                      <button type="button" onClick={alignWithElevenLabs} disabled={aligning} className="w-full mt-2 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-100 hover:bg-fuchsia-500/25 disabled:opacity-60">
                        {aligning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Alineando con tu voz…</> : <><Mic className="w-3.5 h-3.5" /> 🎯 Sincronizar exacto (ElevenLabs)</>}
                      </button>
                    )}
                  </>
                ) : (
                  <button type="button" onClick={() => audioFileRef.current?.click()} className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70">
                    <Upload className="w-3.5 h-3.5" /> Subir mi voz (MP3/WAV/M4A)
                  </button>
                )}
              </div>
              {/* Subtítulos quemados + música de fondo (siempre visible) */}
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Subtítulos y música</label>
                <div className="space-y-2">
                  <button type="button" onClick={() => setSubtitles((v) => !v)} className={`w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-xl border transition-all ${subtitles ? "bg-violet-500/15 border-violet-500/30 text-violet-200" : "bg-white/5 border-white/10 text-white/55"}`}>
                    <Subtitles className="w-3.5 h-3.5" /> Subtítulos quemados {subtitles ? "ON" : "OFF"}
                  </button>
                  <input ref={subFileRef} type="file" accept=".txt,.csv,text/plain,text/csv" onChange={onSubtitleFile} className="hidden" />
                  <button type="button" onClick={() => subFileRef.current?.click()} className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/55" title="Una línea = un subtítulo/escena">
                    <Upload className="w-3.5 h-3.5" /> Subir letras (TXT/CSV)
                  </button>
                  <button type="button" onClick={() => setTransitions((v) => !v)} className={`w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-xl border transition-all ${transitions ? "bg-violet-500/15 border-violet-500/30 text-violet-200" : "bg-white/5 border-white/10 text-white/55"}`} title="Transición entre clips">
                    <Film className="w-3.5 h-3.5" /> Transiciones {transitions ? "ON" : "OFF"}
                  </button>
                  {transitions && (
                    <select value={transitionStyle} onChange={(e) => setTransitionStyle(e.target.value as "fade" | "xfade")} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-violet-500/40" title="Estilo de transición">
                      <option value="fade" className="bg-[#0f1219]">Fundido (todas las duraciones)</option>
                      <option value="xfade" className="bg-[#0f1219]">Crossfade real (videos ≤30s)</option>
                    </select>
                  )}
                  <input ref={musicRef} type="file" accept="audio/*" onChange={onMusicFile} className="hidden" />
                  {musicFile ? (
                    <>
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2.5 py-2">
                        <Music className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                        <span className="text-white/70 text-[11px] truncate flex-1">{musicFile.name}</span>
                        <button type="button" onClick={clearMusic} className="text-white/60 hover:text-red-300"><X className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/45 text-[10px] whitespace-nowrap">Vol. música</span>
                        <input type="range" min={0} max={0.6} step={0.02} value={musicVol} onChange={(e) => setMusicVol(+e.target.value)} className="flex-1 accent-violet-500" />
                        <span className="text-white/45 text-[10px] w-8 text-right">{Math.round(musicVol * 100)}%</span>
                      </div>
                    </>
                  ) : (
                    <button type="button" onClick={() => musicRef.current?.click()} className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/55">
                      <Music className="w-3.5 h-3.5" /> Música de fondo (opcional)
                    </button>
                  )}
                </div>
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
                {([["video", "Pexels"], ["pixabay-video", "Pixabay"], ["photo", "Fotos"], ["wikimedia", "Wiki"], ["archive", "Archive"]] as const).map(([v, l]) => (
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
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/55">Clips</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{clips.length}</span>
                  <button onClick={() => { stopPreview(); setClips([]); setSelectedId(null); }} className="text-[10px] font-bold text-white/40 hover:text-red-300">Vaciar</button>
                </div>
              </div>
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
              {error && <p className="text-red-400 text-xs">{error}</p>}
            </div>
          )}
        </div>

        {/* ════ Centro: preview + timeline + inspector ════ */}
        <div className="space-y-4">
          {/* Preview */}
          <div className="glass-card rounded-2xl border border-white/10 p-3">
            <div className={`relative ${aspectCls} w-full max-w-[460px] max-h-[40vh] sm:max-h-[46vh] mx-auto rounded-xl overflow-hidden bg-black border border-white/10`}>
              {cur ? (
                <div key={cur.id} className="absolute inset-0 animate-in fade-in duration-500">
                  {cur.media ? (cur.media.type === "video" ? (
                    <video src={cur.media.url} autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: cssFilter(cur.effect) }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cur.media.url} alt="" className="w-full h-full object-cover" style={{ filter: cssFilter(cur.effect), animation: cur.effect === "zoom" || cur.media.type === "photo" ? "kenburns 6s ease-out forwards" : undefined }} />
                  )) : <div className="w-full h-full bg-gradient-to-br from-violet-700 to-fuchsia-900" />}
                  {cur.narration && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2"><p className="text-white/90 text-[11px] sm:text-xs font-medium text-center drop-shadow line-clamp-2" title={cur.narration}>{cur.narration}</p></div>}
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
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <p className="text-white/55 text-[10px] font-bold uppercase tracking-wider">Línea de producción</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/40 text-[10px]">A todos:</span>
                  <select value={bulkEffect} onChange={(e) => setBulkEffect(e.target.value as Effect)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none" title="Color / efecto a todos">
                    {EFFECTS.map((e) => <option key={e.v} value={e.v} className="bg-[#0f1219]">{e.label}</option>)}
                  </select>
                  <select value={bulkTransition} onChange={(e) => setBulkTransition(e.target.value as Transition)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none" title="Transición a todos">
                    <option value="fade" className="bg-[#0f1219]">Fade</option><option value="zoom" className="bg-[#0f1219]">Zoom</option><option value="slide" className="bg-[#0f1219]">Slide</option>
                  </select>
                  <button onClick={applyToAll} className="inline-flex items-center bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow shadow-violet-500/30">Aplicar a todos</button>
                </div>
              </div>
              {flash && <p className="text-emerald-300 text-[10px] mb-2 text-right">{flash}</p>}
              <div className="overflow-x-auto scrollbar-hide pb-2">
                <div className="flex gap-1">
                {clips.map((c, i) => (
                  <div key={c.id} onClick={() => setSelectedId(c.id)} style={{ width: Math.max(64, c.seconds * PX_PER_SEC) }}
                    className={`group relative h-16 rounded-lg overflow-hidden border flex-shrink-0 transition-all cursor-pointer ${selectedId === c.id ? "border-violet-400 ring-2 ring-violet-500/40" : "border-white/10 hover:border-white/30"}`}>
                    {c.media ? (
                      c.media.type === "video" && c.media.thumb === c.media.url ? (
                        <video src={c.media.url} muted playsInline preload="metadata" className="w-full h-full object-cover pointer-events-none" style={{ filter: cssFilter(c.effect) }} />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.media.thumb} alt="" className="w-full h-full object-cover pointer-events-none" style={{ filter: cssFilter(c.effect) }} />
                      )
                    ) : c.loadingMedia ? <div className="w-full h-full flex items-center justify-center bg-black"><Loader2 className="w-4 h-4 animate-spin text-white/40" /></div> : <div className="w-full h-full bg-gradient-to-br from-violet-700 to-fuchsia-900" />}
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-black/60 text-white px-1 rounded pointer-events-none">{c.seconds}s</span>
                    <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white/80 pointer-events-none">{i + 1}</span>
                    {typeof c.narrationDur === "number" && c.narrationDur > 0 && (
                      <span className={`absolute top-0.5 right-0.5 text-[8px] font-bold px-1 rounded pointer-events-none ${c.seconds < c.narrationDur - 0.15 ? "bg-red-600/90 text-white" : "bg-emerald-600/85 text-white"}`} title={c.seconds < c.narrationDur - 0.15 ? "El clip es más corto que su voz — estíralo o añade otro recurso" : "La voz cabe en el clip"}>🎙️{c.narrationDur.toFixed(1)}s</span>
                    )}
                    {c.effect !== "none" && <span className="absolute bottom-0.5 right-0.5 text-[8px] font-bold bg-violet-600/85 text-white px-1 rounded pointer-events-none">{EFFECT_SHORT[c.effect] || c.effect}</span>}
                    {/* Handles de recorte (arrastrar con el ratón) */}
                    <div onPointerDown={(e) => startTrim(e, c, "left")} className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-violet-400/0 hover:bg-violet-400/70 opacity-0 group-hover:opacity-100 transition-colors" title="Arrastra para recortar el inicio" style={{ touchAction: "none" }} />
                    <div onPointerDown={(e) => startTrim(e, c, "right")} className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-violet-400/0 hover:bg-violet-400/70 opacity-0 group-hover:opacity-100 transition-colors" title="Arrastra para recortar el final" style={{ touchAction: "none" }} />
                    {/* Mover */}
                    <div className="absolute inset-x-0 top-0 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(ev) => { ev.stopPropagation(); moveClip(c.id, -1); }} className="bg-black/70 hover:bg-black text-white w-5 h-5 flex items-center justify-center rounded" title="Mover izquierda"><ChevronLeft className="w-3 h-3" /></button>
                      <button onClick={(ev) => { ev.stopPropagation(); moveClip(c.id, 1); }} className="bg-black/70 hover:bg-black text-white w-5 h-5 flex items-center justify-center rounded" title="Mover derecha"><ChevronRight className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
                </div>
                {customAudio && wavePeaks && (
                  <div className="mt-1.5">
                    <div className="flex items-center gap-1 mb-0.5 text-emerald-300/80 text-[10px] font-semibold"><Volume2 className="w-3 h-3" /> Audio: {customAudio.name} · {customAudioDur}s{totalSec !== customAudioDur && <span className="text-amber-300/80"> · clips {totalSec}s {totalSec < customAudioDur ? `(faltan ${customAudioDur - totalSec}s de video)` : `(sobran ${totalSec - customAudioDur}s)`}</span>}</div>
                    <canvas ref={waveCanvasRef} className="h-11 rounded bg-emerald-500/5 border border-emerald-500/20 block" style={{ width: Math.max(64, customAudioDur * PX_PER_SEC) }} />
                  </div>
                )}
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
