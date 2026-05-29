"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, Download, AlertCircle, RefreshCw, Image as ImageIcon, Video as VideoIcon, Zap, Crown, Wand2 } from "lucide-react";
import { MUAPI_MODELS } from "@/lib/ai/muapi";
import { getCost } from "@/lib/pricing";

const SAMPLE_PROMPTS: Record<"image" | "video", string[]> = {
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

type Kind = "image" | "video";

interface Props {
  kind: Kind;
  /** Tono de gradient del card (matchea con la categoría) */
  gradient?: string;
  /** Modelo por defecto */
  defaultModel?: string;
  /** Placeholder del prompt */
  placeholder?: string;
}

export function AIPlayground({
  kind,
  gradient = "from-cyan-500 to-blue-600",
  defaultModel,
  placeholder,
}: Props) {
  const models = MUAPI_MODELS[kind];
  const [model, setModel] = useState<string>(defaultModel ?? models[0].slug);
  const [prompt, setPrompt] = useState("");
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [duration, setDuration] = useState(5);
  const [aspect, setAspect] = useState("16:9");

  type Status = "idle" | "queued" | "pending" | "processing" | "completed" | "succeeded" | "failed" | "cancelled";
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const TERMINAL_OK: Status[] = ["completed", "succeeded"];
  const TERMINAL_FAIL: Status[] = ["failed", "cancelled"];

  // Polling loop
  useEffect(() => {
    if (!jobId || TERMINAL_OK.includes(status) || TERMINAL_FAIL.includes(status)) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai/status/${encodeURIComponent(jobId)}`);
        const job = await res.json();
        if (!res.ok) {
          setStatus("failed");
          setError(job.error ?? "Error consultando job");
          return;
        }
        setStatus(job.status as Status);
        if (TERMINAL_OK.includes(job.status as Status)) {
          // Normaliza outputs: output | urls | result_url
          const raw = job.output ?? job.urls ?? job.result_url ?? [];
          const out = Array.isArray(raw) ? raw : raw ? [raw] : [];
          setOutput(out);
        } else if (TERMINAL_FAIL.includes(job.status as Status)) {
          setError(job.error ?? "Generación falló");
        }
      } catch (e) {
        setStatus("failed");
        setError(e instanceof Error ? e.message : "Error de red");
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId, status]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setError(null);
    setOutput([]);
    setStatus("queued");

    const body: Record<string, unknown> = { model, prompt };
    if (kind === "image") {
      body.width = width;
      body.height = height;
    } else {
      body.duration = duration;
      body.aspect_ratio = aspect;
    }

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const job = await res.json();
      if (!res.ok) {
        setStatus("failed");
        setError(job.error ?? `Error ${res.status}`);
        return;
      }
      setJobId(job.id);
      setStatus(job.status || "queued");
    } catch (e) {
      setStatus("failed");
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  };

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setJobId(null);
    setStatus("idle");
    setOutput([]);
    setError(null);
  };

  const isWorking = status === "queued" || status === "pending" || status === "processing";
  const Icon = kind === "image" ? ImageIcon : VideoIcon;

  const cost = getCost(model);
  // Mock: credits del usuario (cuando esté Supabase vendrá de DB)
  const userCredits = 10;
  const isFreePlan = true;

  return (
    <div className="glass-card rounded-3xl border border-white/10 p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ring-1 ring-white/20 flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-base">Playground · {kind === "image" ? "Imagen" : "Video"}</h3>
            <p className="text-white/45 text-xs">Prueba gratis · Muapi.ai</p>
          </div>
        </div>

        {/* Credits badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-full px-2.5 py-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-300 text-[11px] font-bold">{userCredits} créditos</span>
          </div>
          {isFreePlan && (
            <Link href="/pricing" className="inline-flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow shadow-cyan-500/30 transition-all">
              <Crown className="w-3 h-3" /> Pro
            </Link>
          )}
        </div>
      </div>

      {/* Sample prompts strip — para probar rápido */}
      <div>
        <p className="text-white/45 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Wand2 className="w-3 h-3" /> Prompts de ejemplo — un click para probar
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

      {/* Model selector */}
      <div>
        <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Modelo</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={isWorking}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/40 disabled:opacity-50"
        >
          {models.map((m) => (
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
            : "Time-lapse aéreo de una ciudad futurista al atardecer, motion blur, dramatic lighting...")}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 resize-none disabled:opacity-50"
        />
      </div>

      {/* Params */}
      {kind === "image" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Ancho</label>
            <select value={width} onChange={(e) => setWidth(+e.target.value)} disabled={isWorking}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/40 disabled:opacity-50">
              {[512, 768, 1024, 1536, 2048].map((n) => <option key={n} value={n} className="bg-[#0f1219]">{n}px</option>)}
            </select>
          </div>
          <div>
            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Alto</label>
            <select value={height} onChange={(e) => setHeight(+e.target.value)} disabled={isWorking}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/40 disabled:opacity-50">
              {[512, 768, 1024, 1536, 2048].map((n) => <option key={n} value={n} className="bg-[#0f1219]">{n}px</option>)}
            </select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Duración</label>
            <select value={duration} onChange={(e) => setDuration(+e.target.value)} disabled={isWorking}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/40 disabled:opacity-50">
              {[3, 5, 10, 15, 30].map((n) => <option key={n} value={n} className="bg-[#0f1219]">{n} seg</option>)}
            </select>
          </div>
          <div>
            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Aspect</label>
            <select value={aspect} onChange={(e) => setAspect(e.target.value)} disabled={isWorking}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/40 disabled:opacity-50">
              <option value="16:9" className="bg-[#0f1219]">16:9 horizontal</option>
              <option value="9:16" className="bg-[#0f1219]">9:16 vertical</option>
              <option value="1:1"  className="bg-[#0f1219]">1:1 cuadrado</option>
            </select>
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isWorking || userCredits < cost}
        className={`shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r ${gradient} hover:opacity-95 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
      >
        {isWorking ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {status === "queued" ? "En cola..." : "Generando..."}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generar {kind === "image" ? "imagen" : "video"}
            <span className="bg-black/20 backdrop-blur px-2 py-0.5 rounded-md text-[11px] font-mono ml-1">
              <Zap className="w-2.5 h-2.5 inline -mt-0.5" /> {cost}
            </span>
          </>
        )}
      </button>

      {/* Out of credits banner */}
      {userCredits < cost && !isWorking && (
        <div className="bg-gradient-to-br from-orange-500/15 to-yellow-500/10 border border-orange-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Crown className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm">Necesitas {cost - userCredits} créditos más</p>
              <p className="text-white/55 text-xs mt-0.5 mb-3">Sube a Pro y obtén 500 créditos/mes + todos los modelos premium.</p>
              <Link
                href="/pricing"
                className="shine-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:opacity-95 text-black font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-orange-500/30 transition-all"
              >
                Ver planes <Crown className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm min-w-0 flex-1">
            <p className="text-red-300 font-bold">Error</p>
            <p className="text-red-200/70 text-xs break-words">{error}</p>
            <button onClick={reset} className="mt-2 inline-flex items-center gap-1 text-red-300 hover:text-red-200 text-xs font-semibold">
              <RefreshCw className="w-3 h-3" /> Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Output */}
      {output.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-white/8">
          <div className="flex items-center justify-between">
            <p className="text-white font-bold text-sm">Resultado</p>
            <button onClick={reset} className="text-white/45 hover:text-white text-xs font-semibold inline-flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Nuevo
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {output.map((url, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                {kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={`Generated ${i + 1}`} className="w-full h-auto block" />
                ) : (
                  <video src={url} controls className="w-full h-auto block" />
                )}
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="absolute top-2 right-2 inline-flex items-center gap-1 bg-black/60 backdrop-blur border border-white/20 hover:bg-black/80 text-white text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Download className="w-3 h-3" /> Descargar
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state placeholder */}
      {status === "idle" && output.length === 0 && !error && (
        <div className="bg-white/3 border border-dashed border-white/15 rounded-2xl p-6 text-center">
          <Sparkles className="w-6 h-6 text-white/30 mx-auto mb-2" />
          <p className="text-white/45 text-xs">Escribe un prompt y pulsa generar. Tu resultado aparecerá aquí.</p>
        </div>
      )}
    </div>
  );
}
