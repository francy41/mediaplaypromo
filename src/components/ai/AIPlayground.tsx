"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Download, AlertCircle, RefreshCw, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { MUAPI_MODELS } from "@/lib/ai/muapi";

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

  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "queued" | "processing" | "succeeded" | "failed">("idle");
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling loop
  useEffect(() => {
    if (!jobId || status === "succeeded" || status === "failed") return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai/status/${encodeURIComponent(jobId)}`);
        const job = await res.json();
        if (!res.ok) {
          setStatus("failed");
          setError(job.error ?? "Error consultando job");
          return;
        }
        setStatus(job.status);
        if (job.status === "succeeded") {
          const out = Array.isArray(job.output) ? job.output : job.output ? [job.output] : [];
          setOutput(out);
        } else if (job.status === "failed") {
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

  const isWorking = status === "queued" || status === "processing";
  const Icon = kind === "image" ? ImageIcon : VideoIcon;

  return (
    <div className="glass-card rounded-3xl border border-white/10 p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ring-1 ring-white/20`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold text-base">Playground · {kind === "image" ? "Imagen" : "Video"}</h3>
          <p className="text-white/45 text-xs">Genera con IA en tiempo real · powered by Muapi</p>
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
        disabled={!prompt.trim() || isWorking}
        className={`shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r ${gradient} hover:opacity-95 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
      >
        {isWorking ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {status === "queued" ? "En cola..." : "Generando..."}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" /> Generar {kind === "image" ? "imagen" : "video"}
          </>
        )}
      </button>

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
