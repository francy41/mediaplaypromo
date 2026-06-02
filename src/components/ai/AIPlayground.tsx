"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2, Sparkles, Download, AlertCircle, RefreshCw,
  Image as ImageIcon, Video as VideoIcon, Zap, Crown, Wand2, FolderDown, CheckCircle2,
  Layers, ArrowRight, Clock, XCircle, Upload, ImagePlus, X
} from "lucide-react";
import { MUAPI_MODELS } from "@/lib/ai/muapi";
import { getCost } from "@/lib/pricing";
import { trackGeneration } from "@/lib/stats";
import { usePathname } from "next/navigation";

type Kind = "image" | "video";

interface Props {
  kind: Kind;
  gradient?: string;
  defaultModel?: string;
  placeholder?: string;
}

type JobStatus = "idle" | "queued" | "pending" | "processing" | "completed" | "succeeded" | "failed" | "cancelled";

interface Job {
  index: number;
  jobId: string | null;
  status: JobStatus;
  output: string[];
  error?: string;
}

const SAMPLE_PROMPTS: Record<Kind, string[]> = {
  image: [
    "Astronauta corriendo en Marte, cinematic, golden hour, 4K, photorealistic",
    "Logotipo minimalista para startup tech, vector, blanco sobre fondo negro",
    "Café gourmet en mesa de mármol, luz natural, estilo Instagram food",
    "Retrato cyberpunk, neón rosa y cyan, lluvia, alta detalle",
    "Producto cosmético sobre fondo dorado, e-commerce, studio lighting",
  ],
  video: [
    "Time-lapse aéreo de ciudad futurista al atardecer, motion blur",
    "Producto rotando sobre mármol blanco, e-commerce, 360°",
    "Persona caminando en bosque otoñal, cámara siguiendo, slow motion",
    "Olas rompiendo en playa tropical, golden hour, drone shot",
    "Robot humanoide presentando producto, futuristic studio",
  ],
};

const TERMINAL_OK: JobStatus[] = ["completed", "succeeded"];
const TERMINAL_FAIL: JobStatus[] = ["failed", "cancelled"];

export function AIPlayground({ kind, gradient = "from-cyan-500 to-blue-600", defaultModel, placeholder }: Props) {
  const models = MUAPI_MODELS[kind];
  const families = Array.from(new Set(models.map((m) => m.category)));

  const [family, setFamily] = useState<string>(() => {
    if (!defaultModel) return families[0];
    const def = models.find((m) => m.slug === defaultModel);
    return def?.category ?? families[0];
  });
  const familyModels = models.filter((m) => m.category === family);

  const [model, setModel] = useState<string>(defaultModel ?? familyModels[0]?.slug ?? models[0].slug);
  const [prompt, setPrompt] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [duration, setDuration] = useState(5);
  const [aspect, setAspect] = useState("16:9");
  const [resolution, setResolution] = useState("720p");

  const pathname = usePathname();
  const categorySlug = pathname?.match(/\/categories\/([^/]+)/)?.[1];

  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [downloadFolder, setDownloadFolder] = useState<FileSystemDirectoryHandle | null>(null);
  const [sourceImage, setSourceImage] = useState<{ dataUrl: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ¿El modelo seleccionado es image-to-video / reference?
  const needsImage = /image-to-video|i2v|reference|edit/i.test(model);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Solo se aceptan archivos de imagen (JPG, PNG, WebP)."); return; }
    if (file.size > 3 * 1024 * 1024) { setError("La imagen supera 3MB. Comprímela o usa una más ligera."); return; }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setSourceImage({ dataUrl: reader.result as string, name: file.name });
    reader.readAsDataURL(file);
  };

  // Switch model si cambias de familia
  useEffect(() => {
    if (!familyModels.find((m) => m.slug === model)) {
      setModel(familyModels[0]?.slug ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family]);

  // Polling de todos los jobs activos
  useEffect(() => {
    const inFlight = jobs.some((j) => !TERMINAL_OK.includes(j.status) && !TERMINAL_FAIL.includes(j.status) && j.jobId);
    if (!inFlight) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }

    pollRef.current = setInterval(async () => {
      const toPoll = jobs.filter((j) => j.jobId && !TERMINAL_OK.includes(j.status) && !TERMINAL_FAIL.includes(j.status));
      const updates = await Promise.all(toPoll.map(async (j) => {
        try {
          const res = await fetch(`/api/ai/status/${encodeURIComponent(j.jobId!)}`);
          const data = await res.json();
          if (!res.ok) return { index: j.index, status: "failed" as JobStatus, output: [], error: data.error ?? "Error" };
          const s = data.status as JobStatus;
          if (TERMINAL_OK.includes(s)) {
            const raw = data.output ?? data.urls ?? data.result_url ?? [];
            const out = Array.isArray(raw) ? raw : raw ? [raw] : [];
            return { index: j.index, status: s, output: out };
          }
          if (TERMINAL_FAIL.includes(s)) {
            return { index: j.index, status: s, output: [], error: data.error ?? "Falló" };
          }
          return { index: j.index, status: s, output: [] };
        } catch (e) {
          return { index: j.index, status: "failed" as JobStatus, output: [], error: e instanceof Error ? e.message : "Error red" };
        }
      }));

      setJobs((prev) => prev.map((j) => {
        const u = updates.find((x) => x.index === j.index);
        return u ? { ...j, status: u.status, output: u.output, error: u.error } : j;
      }));
    }, 2500);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobs]);

  const handleGenerate = async () => {
    if (!prompt.trim() || quantity < 1) return;
    if (needsImage && !sourceImage) {
      setError("Este modelo (image-to-video) necesita una imagen de origen. Súbela arriba para continuar.");
      return;
    }
    setError(null);
    setIsLaunching(true);
    setJobs(Array.from({ length: quantity }, (_, i) => ({ index: i, jobId: null, status: "queued", output: [] })));

    // Tracking: incrementa contador de la categoría visible
    if (categorySlug) trackGeneration(categorySlug, quantity);

    const shared: Record<string, unknown> = {};
    if (kind === "image") {
      shared.width = width;
      shared.height = height;
    } else {
      shared.duration = duration;
      shared.aspect_ratio = aspect;
      shared.resolution = resolution;
    }
    // Imagen de origen (image-to-video / referencia)
    if (sourceImage) {
      shared.image = sourceImage.dataUrl;
      shared.image_url = sourceImage.dataUrl;
    }

    try {
      if (quantity === 1) {
        const res = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, prompt, ...shared }),
        });
        const job = await res.json();
        if (!res.ok) {
          setError(job.error ?? `Error ${res.status}`);
          setJobs([{ index: 0, jobId: null, status: "failed", output: [], error: job.error }]);
          return;
        }
        setJobs([{ index: 0, jobId: job.id, status: job.status || "queued", output: [] }]);
      } else {
        // Multi-quantity → usa endpoint batch (mismo prompt N veces)
        const prompts = Array.from({ length: quantity }, () => prompt);
        const res = await fetch("/api/ai/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, prompts, shared, concurrency: 5 }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? `Error ${res.status}`);
          setJobs((prev) => prev.map((j) => ({ ...j, status: "failed" as JobStatus, error: data.error })));
          return;
        }
        setJobs((prev) => prev.map((j) => {
          const r = data.results.find((x: { index: number }) => x.index === j.index);
          if (!r) return { ...j, status: "failed" as JobStatus, error: "No result" };
          if (r.status === "queued") return { ...j, jobId: r.jobId, status: "queued" };
          return { ...j, status: "failed" as JobStatus, error: r.error };
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setJobs((prev) => prev.map((j) => ({ ...j, status: "failed" as JobStatus })));
    } finally {
      setIsLaunching(false);
    }
  };

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setJobs([]);
    setError(null);
  };

  const pickFolder = async () => {
    // File System Access API (Chrome/Edge)
    const w = window as unknown as { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> };
    if (!w.showDirectoryPicker) {
      alert("Tu navegador no soporta selector de carpeta. Los archivos se descargarán a tu carpeta de Descargas por defecto.");
      return;
    }
    try {
      const handle = await w.showDirectoryPicker();
      setDownloadFolder(handle);
    } catch {
      // user cancelled
    }
  };

  const downloadAll = async () => {
    const items = jobs.flatMap((j, i) => j.output.map((url, k) => ({ url, name: `${kind}-${i + 1}-${k + 1}.${kind === "video" ? "mp4" : "png"}` })));
    if (items.length === 0) return;

    if (downloadFolder) {
      // Guardado directo en carpeta elegida
      try {
        for (const item of items) {
          const res = await fetch(item.url);
          const blob = await res.blob();
          const fileHandle = await downloadFolder.getFileHandle(item.name, { create: true });
          const writable = await (fileHandle as unknown as { createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }> }).createWritable();
          await writable.write(blob);
          await writable.close();
        }
        alert(`✅ ${items.length} archivos guardados en la carpeta seleccionada.`);
      } catch (e) {
        alert(`Error guardando: ${e instanceof Error ? e.message : "?"}`);
      }
    } else {
      // Fallback: descarga individual a Descargas
      for (const item of items) {
        const a = document.createElement("a");
        a.href = item.url;
        a.download = item.name;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        await new Promise((r) => setTimeout(r, 400)); // throttle navegador
      }
    }
  };

  // Stats
  const total = jobs.length;
  const completed = jobs.filter((j) => TERMINAL_OK.includes(j.status)).length;
  const failed = jobs.filter((j) => TERMINAL_FAIL.includes(j.status)).length;
  const working = total - completed - failed;
  const isWorking = working > 0 || isLaunching;
  const progressPct = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;
  const allOutputs = jobs.flatMap((j) => j.output);

  const cost = getCost(model);
  const totalCost = cost * quantity;
  const userCredits = 10;

  const Icon = kind === "image" ? ImageIcon : VideoIcon;

  return (
    <div className="glass-card rounded-3xl border border-white/10 p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ring-1 ring-white/20 flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-base">Playground · {kind === "image" ? "Imagen" : "Video"}</h3>
            <p className="text-white/45 text-xs">{models.length} modelos · powered by Muapi.ai</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-full px-2.5 py-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-300 text-[11px] font-bold">{userCredits} créditos</span>
          </div>
          <Link href="/pricing" className="inline-flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow shadow-cyan-500/30 transition-all">
            <Crown className="w-3 h-3" /> Pro
          </Link>
        </div>
      </div>

      {/* Sample prompts */}
      <div>
        <p className="text-white/45 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Wand2 className="w-3 h-3" /> Prompts de ejemplo
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          {SAMPLE_PROMPTS[kind].map((p, i) => (
            <button
              key={i}
              onClick={() => setPrompt(p)}
              disabled={isWorking}
              className="flex-shrink-0 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/40 text-white/75 hover:text-white text-[11px] px-3 py-1.5 rounded-full transition-all disabled:opacity-50 max-w-[220px] truncate"
            >
              {p.slice(0, 40)}{p.length > 40 ? "..." : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Family pills */}
      <div>
        <p className="text-white/55 text-[10px] font-bold uppercase tracking-wider mb-2">Familia · {families.length}</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          {families.map((f) => (
            <button
              key={f}
              onClick={() => setFamily(f)}
              disabled={isWorking}
              className={`flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all disabled:opacity-50 whitespace-nowrap ${
                family === f
                  ? `bg-gradient-to-r ${gradient} text-white shadow-lg`
                  : "bg-white/5 border border-white/10 text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Model selector (filtrado por familia) */}
      <div>
        <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">
          Modelo · {familyModels.length} en {family}
        </label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={isWorking}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/40 disabled:opacity-50"
        >
          {familyModels.map((m) => (
            <option key={m.slug} value={m.slug} className="bg-[#0f1219]">
              {m.label} · {m.priceHint}
            </option>
          ))}
        </select>
      </div>

      {/* Prompt */}
      <div>
        <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isWorking}
          rows={3}
          placeholder={placeholder ?? (kind === "image"
            ? "Un astronauta corriendo en Marte, cinematic, golden hour, 4K..."
            : "Time-lapse aéreo de una ciudad futurista al atardecer, motion blur...")}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 resize-none disabled:opacity-50"
        />
        {/* Detección de prompts múltiples → sugerir Batch */}
        {prompt.split("\n").filter((l) => l.trim()).length > 1 && (
          <Link
            href="/admin/batch"
            className="mt-2 inline-flex items-center gap-1.5 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Layers className="w-3.5 h-3.5" /> Detecté {prompt.split("\n").filter((l) => l.trim()).length} líneas — usa el Batch Generator para que cada una sea un video distinto
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Cantidad — pills visuales grandes */}
      <div>
        <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">
          Cantidad · ¿Cuántos {kind === "video" ? "videos" : "imágenes"} quieres?
        </label>
        <div className="grid grid-cols-6 gap-1.5">
          {[1, 2, 3, 5, 10, 20].map((n) => (
            <button
              key={n}
              onClick={() => setQuantity(n)}
              disabled={isWorking}
              className={`px-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                quantity === n
                  ? `bg-gradient-to-r ${gradient} text-white shadow-lg ring-1 ring-white/20`
                  : "bg-white/5 border border-white/10 text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {kind === "video" ? (
        <>
          {/* Formato — Aspect ratio con iconos visuales */}
          <div>
            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">
              Formato · Orientación del video
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: "16:9", label: "Horizontal", desc: "YouTube, TV", w: 28, h: 16 },
                { v: "9:16", label: "Vertical",   desc: "TikTok, Reels", w: 16, h: 28 },
                { v: "1:1",  label: "Cuadrado",   desc: "Instagram", w: 22, h: 22 },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setAspect(opt.v)}
                  disabled={isWorking}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all disabled:opacity-50 ${
                    aspect === opt.v
                      ? `bg-gradient-to-br ${gradient} bg-opacity-20 border-white/30 ring-2 ring-white/15`
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div
                    style={{ width: `${opt.w}px`, height: `${opt.h}px` }}
                    className={`rounded-md ${
                      aspect === opt.v ? "bg-white" : "bg-white/30 border border-white/40"
                    }`}
                  />
                  <div className="text-center">
                    <p className={`text-[11px] font-bold ${aspect === opt.v ? "text-white" : "text-white/80"}`}>{opt.label}</p>
                    <p className="text-white/40 text-[9px]">{opt.v}</p>
                    <p className="text-white/30 text-[9px]">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Duración + Resolución */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Duración</label>
              <select value={duration} onChange={(e) => setDuration(+e.target.value)} disabled={isWorking}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/40 disabled:opacity-50">
                {[3, 5, 6, 8, 10, 15, 30].map((n) => <option key={n} value={n} className="bg-[#0f1219]">{n} segundos</option>)}
              </select>
            </div>
            <div>
              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Calidad (resolución)</label>
              <select value={resolution} onChange={(e) => setResolution(e.target.value)} disabled={isWorking}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/40 disabled:opacity-50">
                <option value="480p"  className="bg-[#0f1219]">480p · Estándar (más rápido)</option>
                <option value="720p"  className="bg-[#0f1219]">720p · HD (equilibrado)</option>
                <option value="1080p" className="bg-[#0f1219]">1080p · Full HD (premium)</option>
              </select>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Ancho</label>
            <select value={width} onChange={(e) => setWidth(+e.target.value)} disabled={isWorking}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/40 disabled:opacity-50">
              {[512, 768, 1024, 1536, 2048].map((n) => <option key={n} value={n} className="bg-[#0f1219]">{n}px</option>)}
            </select>
          </div>
          <div>
            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Alto</label>
            <select value={height} onChange={(e) => setHeight(+e.target.value)} disabled={isWorking}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/40 disabled:opacity-50">
              {[512, 768, 1024, 1536, 2048].map((n) => <option key={n} value={n} className="bg-[#0f1219]">{n}px</option>)}
            </select>
          </div>
        </div>
      )}

      {/* ── Subir imagen local (image-to-video / referencia) ── */}
      <div>
        <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <ImagePlus className="w-3 h-3" />
          Imagen de origen {needsImage ? <span className="text-pink-400">· requerida para este modelo</span> : <span className="text-white/30">· opcional (para animar tu foto)</span>}
        </label>

        {/* input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleImageUpload}
          className="hidden"
        />

        {sourceImage ? (
          /* Preview con la imagen cargada */
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sourceImage.dataUrl} alt="origen" className="w-14 h-14 rounded-lg object-cover ring-1 ring-white/15 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate">{sourceImage.name}</p>
              <p className="text-green-400 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Imagen cargada
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isWorking}
              className="text-white/55 hover:text-white text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cambiar
            </button>
            <button
              onClick={() => setSourceImage(null)}
              disabled={isWorking}
              className="w-7 h-7 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-white/45 hover:text-red-400 transition-colors disabled:opacity-50"
              aria-label="Quitar imagen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Zona de drop / click para subir */
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isWorking}
            className={`w-full flex items-center justify-center gap-2.5 border-2 border-dashed rounded-xl py-4 transition-colors disabled:opacity-50 ${
              needsImage
                ? "border-pink-500/40 bg-pink-500/5 hover:bg-pink-500/10 text-pink-300"
                : "border-white/15 bg-white/[0.02] hover:bg-white/5 text-white/60"
            }`}
          >
            <Upload className="w-5 h-5" />
            <div className="text-left">
              <p className="text-sm font-bold">Subir imagen desde tu PC</p>
              <p className="text-[10px] opacity-70">JPG, PNG o WebP · máx 10MB</p>
            </div>
          </button>
        )}
      </div>

      {/* Folder picker */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={pickFolder}
          disabled={isWorking}
          className={`inline-flex items-center gap-1.5 border text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-50 ${
            downloadFolder
              ? "bg-green-500/15 border-green-500/30 text-green-300 hover:bg-green-500/20"
              : "bg-white/5 border-white/10 text-white/75 hover:bg-white/10"
          }`}
        >
          <FolderDown className="w-3.5 h-3.5" />
          {downloadFolder ? `Carpeta: ${downloadFolder.name}` : "Elegir carpeta de descarga"}
        </button>
        {downloadFolder && (
          <button onClick={() => setDownloadFolder(null)} className="text-white/40 hover:text-white text-xs underline">
            quitar
          </button>
        )}
        <span className="text-white/35 text-[10px] ml-auto">
          {downloadFolder ? "Guardado directo activado" : "Por defecto: carpeta Descargas"}
        </span>
      </div>

      {/* CTA */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isWorking || userCredits < totalCost || (needsImage && !sourceImage)}
        className={`shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r ${gradient} hover:opacity-95 text-white font-bold text-sm px-5 py-3.5 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
      >
        {isWorking ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generando {completed + failed}/{total}...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generar {quantity} {kind === "image" ? (quantity === 1 ? "imagen" : "imágenes") : (quantity === 1 ? "video" : "videos")}
            <span className="bg-black/20 backdrop-blur px-2 py-0.5 rounded-md text-[11px] font-mono ml-1">
              <Zap className="w-2.5 h-2.5 inline -mt-0.5" /> {totalCost}
            </span>
          </>
        )}
      </button>

      {/* Live progress bar (compact summary) */}
      {jobs.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2 text-xs flex-wrap gap-2">
            <span className="text-white font-bold flex items-center gap-1.5">
              {isWorking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              ) : completed === total ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
              )}
              {isWorking ? `Generando ${completed + failed} de ${total}` : `${completed} de ${total} completados`}
            </span>
            <span className="text-cyan-400 font-bold text-sm">{progressPct}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500 ${isWorking ? "gradient-anim" : ""}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-white/55 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> En cola: {jobs.filter((j) => j.status === "queued" || j.status === "pending").length}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Procesando: {jobs.filter((j) => j.status === "processing").length}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Listos: {completed}</span>
            {failed > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Fallidos: {failed}</span>}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm min-w-0 flex-1">
            <p className="text-red-300 font-bold">
              {error.toLowerCase().includes("insufficient") || error.toLowerCase().includes("credit") ? "Sin créditos en Muapi" : "Error"}
            </p>
            <p className="text-red-200/70 text-xs break-words">{error}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button onClick={reset} className="inline-flex items-center gap-1 text-red-300 hover:text-red-200 text-xs font-semibold">
                <RefreshCw className="w-3 h-3" /> Reintentar
              </button>
              {(error.toLowerCase().includes("insufficient") || error.toLowerCase().includes("credit")) && (
                <a href="https://muapi.ai/topup" target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-xs font-bold px-2.5 py-1 rounded-md border border-yellow-500/30 transition-colors">
                  <Zap className="w-3 h-3" /> Recargar Muapi
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Job cards — grid per video con status en vivo */}
      {jobs.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-white/8">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-white font-bold text-sm flex items-center gap-2">
              {kind === "video" ? <VideoIcon className="w-4 h-4 text-cyan-400" /> : <ImageIcon className="w-4 h-4 text-cyan-400" />}
              {kind === "video" ? "Videos" : "Imágenes"} ({completed}/{total} listos)
            </p>
            <div className="flex items-center gap-2">
              {allOutputs.length > 0 && (
                <button
                  onClick={downloadAll}
                  className="shine-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-95 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg shadow-green-500/30 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar todos ({allOutputs.length})
                </button>
              )}
              {!isWorking && (
                <button onClick={reset} className="text-white/45 hover:text-white text-xs font-semibold inline-flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Nuevo
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {jobs.map((job) => (
              <JobCard key={job.index} job={job} kind={kind} gradient={gradient} prompt={prompt} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {jobs.length === 0 && !error && (
        <div className="bg-white/3 border border-dashed border-white/15 rounded-2xl p-6 text-center">
          <Sparkles className="w-6 h-6 text-white/30 mx-auto mb-2" />
          <p className="text-white/45 text-xs">Elige modelo, escribe prompt, cantidad y pulsa generar. Los resultados aparecerán aquí.</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   JobCard — ventana individual por video con status en vivo
   ───────────────────────────────────────────── */
function JobCard({
  job, kind, gradient, prompt,
}: {
  job: Job;
  kind: Kind;
  gradient: string;
  prompt: string;
}) {
  const s = job.status;
  const isQueued = s === "queued" || s === "pending";
  const isProcessing = s === "processing";
  const isDone = TERMINAL_OK.includes(s);
  const isFailed = TERMINAL_FAIL.includes(s);
  const output = job.output[0]; // primer resultado

  const statusLabel =
    isQueued     ? "En cola" :
    isProcessing ? "Procesando" :
    isDone       ? "Listo" :
    isFailed     ? "Falló" : "Esperando";

  const statusColor =
    isQueued     ? "text-yellow-400 bg-yellow-500/15 border-yellow-500/30" :
    isProcessing ? "text-cyan-400 bg-cyan-500/15 border-cyan-500/30" :
    isDone       ? "text-green-400 bg-green-500/15 border-green-500/30" :
    isFailed     ? "text-red-400 bg-red-500/15 border-red-500/30"
                 : "text-white/45 bg-white/5 border-white/10";

  return (
    <div className={`relative rounded-2xl overflow-hidden border bg-[#0a0c12] transition-all ${
      isDone ? "border-green-500/30 shadow-lg shadow-green-500/10" :
      isProcessing ? "border-cyan-500/30 shadow-lg shadow-cyan-500/10" :
      isFailed ? "border-red-500/30" : "border-white/10"
    }`}>
      {/* Header del card */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/40 border-b border-white/8">
        <span className="text-white font-bold text-xs">#{job.index + 1}</span>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
          {isQueued && <Clock className="w-2.5 h-2.5" />}
          {isProcessing && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
          {isDone && <CheckCircle2 className="w-2.5 h-2.5" />}
          {isFailed && <XCircle className="w-2.5 h-2.5" />}
          {statusLabel}
        </span>
      </div>

      {/* Body: media o placeholder animado */}
      <div className="aspect-video relative bg-black flex items-center justify-center overflow-hidden">
        {isDone && output ? (
          kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={output} alt={`Generated ${job.index + 1}`} className="w-full h-full object-cover" />
          ) : (
            <video
              src={output}
              controls
              preload="auto"
              playsInline
              muted
              loop
              className="w-full h-full object-cover bg-black"
            />
          )
        ) : isFailed ? (
          <div className="text-center p-4">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-200/70 text-xs px-2 line-clamp-3">{job.error ?? "Generación falló"}</p>
          </div>
        ) : (
          <>
            {/* Animated placeholder con efecto shimmer */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20`} />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent gradient-anim" />
            {/* Orbs flotando */}
            <div className={`absolute top-1/4 left-1/4 w-16 h-16 bg-gradient-to-br ${gradient} opacity-40 rounded-full blur-2xl float-soft`} />
            <div className={`absolute bottom-1/4 right-1/4 w-12 h-12 bg-gradient-to-br ${gradient} opacity-30 rounded-full blur-2xl float-slow`} />
            {/* Icono central */}
            <div className="relative z-10 text-center">
              <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl mb-2 ring-1 ring-white/20 ${isProcessing ? "glow-pulse" : ""}`}>
                {isProcessing ? (
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                ) : kind === "video" ? (
                  <VideoIcon className="w-7 h-7 text-white" />
                ) : (
                  <ImageIcon className="w-7 h-7 text-white" />
                )}
              </div>
              <p className="text-white/85 text-[11px] font-bold">{statusLabel}{isProcessing ? "..." : ""}</p>
              {isQueued && <p className="text-white/40 text-[9px] mt-0.5">Esperando turno</p>}
              {isProcessing && <p className="text-white/40 text-[9px] mt-0.5">Generando con IA</p>}
            </div>
          </>
        )}

        {/* Download overlay cuando listo */}
        {isDone && output && (
          <a
            href={output}
            target="_blank"
            rel="noreferrer"
            download
            className="absolute top-2 right-2 inline-flex items-center gap-1 bg-black/70 backdrop-blur border border-white/20 hover:bg-black/90 text-white text-[10px] font-semibold px-2 py-1 rounded-md transition-colors"
          >
            <Download className="w-2.5 h-2.5" /> Descargar
          </a>
        )}
      </div>

      {/* Footer: prompt preview */}
      <div className="px-3 py-2 bg-black/40 border-t border-white/8">
        <p className="text-white/45 text-[10px] line-clamp-1">
          {prompt.slice(0, 60)}{prompt.length > 60 ? "..." : ""}
        </p>
      </div>
    </div>
  );
}
