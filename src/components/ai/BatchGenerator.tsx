"use client";
import { useEffect, useRef, useState } from "react";
import {
  Plus, Trash2, Play, Loader2, Download, RefreshCw, Upload, FileText,
  CheckCircle2, AlertCircle, DollarSign, TrendingUp, Sparkles, Wand2, ImagePlus, X
} from "lucide-react";
import { MUAPI_MODELS } from "@/lib/ai/muapi-models";
import { getRealCostUSD, getCustomerPriceUSD, getAdminProfitUSD, ADMIN_MARGIN_PCT } from "@/lib/pricing";

type JobState =
  | { status: "idle" }
  | { status: "queued" | "pending" | "processing"; jobId: string }
  | { status: "completed" | "succeeded"; jobId: string; output: string[] }
  | { status: "failed" | "cancelled"; jobId?: string; error: string };

interface PromptRow {
  id: string;
  prompt: string;
  job: JobState;
}

const SAMPLE_BATCH = [
  "Producto cosmético sobre fondo dorado, e-commerce, studio lighting",
  "Café gourmet en mesa de mármol, luz natural, estilo Instagram food",
  "Logotipo minimalista para startup tech, animación entrada cinematic",
  "Robot humanoide presentando producto, futuristic studio",
  "Time-lapse aéreo ciudad futurista atardecer, motion blur, drone",
];

export function BatchGenerator({ kind = "video" }: { kind?: "image" | "video" }) {
  const models = MUAPI_MODELS[kind];
  const [model, setModel] = useState<string>(
    kind === "video" ? "wan2.2-5b-fast-t2v" : "flux-schnell-image"
  );
  const [rows, setRows] = useState<PromptRow[]>([
    { id: crypto.randomUUID(), prompt: "", job: { status: "idle" } },
  ]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [duration, setDuration] = useState(5);
  const [aspect, setAspect] = useState("16:9");
  const [sourceImage, setSourceImage] = useState<{ dataUrl: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ¿El modelo seleccionado es image-to-video / referencia?
  const needsImage = /image-to-video|i2v|reference|edit/i.test(model);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Solo imágenes (JPG, PNG, WebP)."); return; }
    if (file.size > 3 * 1024 * 1024) { alert("La imagen supera 3MB. Usa una más ligera."); return; }
    const reader = new FileReader();
    reader.onload = () => setSourceImage({ dataUrl: reader.result as string, name: file.name });
    reader.readAsDataURL(file);
  };

  const realCost      = getRealCostUSD(model);
  const customerPrice = getCustomerPriceUSD(model);
  const adminProfit   = getAdminProfitUSD(model);

  const activeCount  = rows.filter((r) => r.prompt.trim()).length;
  const totalReal    = realCost * activeCount;
  const totalCustomer= customerPrice * activeCount;
  const totalProfit  = adminProfit * activeCount;
  const successCount = rows.filter((r) => r.job.status === "completed" || r.job.status === "succeeded").length;
  const failedCount  = rows.filter((r) => r.job.status === "failed" || r.job.status === "cancelled").length;
  const workingCount = rows.filter((r) => ["queued", "pending", "processing"].includes(r.job.status)).length;
  const realProfit   = adminProfit * successCount;

  // Polling de todos los jobs activos
  useEffect(() => {
    const inFlight = rows.some((r) =>
      r.job.status === "queued" || r.job.status === "pending" || r.job.status === "processing"
    );
    if (!inFlight) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }

    pollRef.current = setInterval(async () => {
      const toPoll = rows
        .filter((r) => r.job.status === "queued" || r.job.status === "pending" || r.job.status === "processing")
        .filter((r): r is PromptRow & { job: { status: string; jobId: string } } => "jobId" in r.job);

      const updates = await Promise.all(toPoll.map(async (r) => {
        try {
          const res = await fetch(`/api/ai/status/${encodeURIComponent(r.job.jobId)}`);
          const data = await res.json();
          if (!res.ok) return { id: r.id, job: { status: "failed" as const, jobId: r.job.jobId, error: data.error ?? "Error" } };
          const s = data.status as JobState["status"];
          if (s === "completed" || s === "succeeded") {
            const raw = data.output ?? data.urls ?? data.result_url ?? [];
            const out = Array.isArray(raw) ? raw : raw ? [raw] : [];
            return { id: r.id, job: { status: s, jobId: r.job.jobId, output: out } as JobState };
          }
          if (s === "failed" || s === "cancelled") {
            return { id: r.id, job: { status: s, jobId: r.job.jobId, error: data.error ?? "Falló" } as JobState };
          }
          return { id: r.id, job: { status: s, jobId: r.job.jobId } as JobState };
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Error red";
          return { id: r.id, job: { status: "failed" as const, jobId: r.job.jobId, error: msg } };
        }
      }));

      setRows((prev) => prev.map((r) => {
        const u = updates.find((u) => u.id === r.id);
        return u ? { ...r, job: u.job as JobState } : r;
      }));
    }, 3000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [rows]);

  const addRow = () => setRows((r) => [...r, { id: crypto.randomUUID(), prompt: "", job: { status: "idle" } }]);
  const removeRow = (id: string) => setRows((r) => r.length > 1 ? r.filter((x) => x.id !== id) : r);
  const updatePrompt = (id: string, prompt: string) => setRows((r) => r.map((x) => x.id === id ? { ...x, prompt } : x));
  const loadSamples = () => setRows(SAMPLE_BATCH.map((p) => ({ id: crypto.randomUUID(), prompt: p, job: { status: "idle" } })));
  const clearAll = () => setRows([{ id: crypto.randomUUID(), prompt: "", job: { status: "idle" } }]);

  const pasteCSV = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      setRows(lines.map((l) => ({ id: crypto.randomUUID(), prompt: l, job: { status: "idle" } })));
    } catch {
      alert("No se pudo leer el portapapeles. Pega manualmente.");
    }
  };

  const launchBatch = async () => {
    const prompts = rows.filter((r) => r.prompt.trim()).map((r) => r.prompt.trim());
    if (prompts.length === 0) return;
    if (needsImage && !sourceImage) {
      alert("Este modelo (image-to-video) necesita una imagen de origen. Súbela arriba para continuar.");
      return;
    }
    setIsLaunching(true);

    try {
      const shared: Record<string, unknown> = {};
      if (kind === "video") {
        shared.duration = duration;
        shared.aspect_ratio = aspect;
      }
      if (sourceImage) {
        shared.image = sourceImage.dataUrl;
        shared.image_url = sourceImage.dataUrl;
      }

      const res = await fetch("/api/ai/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompts, shared, concurrency: 5 }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(`Error: ${data.error ?? "Falló"}`);
        return;
      }

      // Mapear resultados por índice
      const activeRows = rows.filter((r) => r.prompt.trim());
      setRows((prev) => prev.map((r) => {
        const idxInActive = activeRows.findIndex((a) => a.id === r.id);
        if (idxInActive === -1) return r;
        const result = data.results.find((x: { index: number }) => x.index === idxInActive);
        if (!result) return r;
        if (result.status === "queued") {
          return { ...r, job: { status: "queued", jobId: result.jobId } };
        }
        return { ...r, job: { status: "failed", error: result.error ?? "Error" } };
      }));
    } catch (e) {
      alert(`Error: ${e instanceof Error ? e.message : "desconocido"}`);
    } finally {
      setIsLaunching(false);
    }
  };

  const exportResults = () => {
    const completed = rows.filter((r) => r.job.status === "completed" || r.job.status === "succeeded");
    const csv = ["prompt,url"].concat(
      completed.flatMap((r) => {
        const j = r.job as { output: string[] };
        return j.output.map((u) => `"${r.prompt.replace(/"/g, '""')}","${u}"`);
      })
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `batch-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-card rounded-3xl border border-fuchsia-500/30 p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br from-fuchsia-500 to-purple-600 opacity-20 rounded-full blur-3xl float-slow" />
        <div className="relative flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="inline-flex items-center gap-2 bg-fuchsia-500/15 border border-fuchsia-500/25 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-300 mb-2">
              <Sparkles className="w-3 h-3" /> BATCH GENERATOR
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Generación{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">en masa</span>
            </h2>
            <p className="text-white/55 text-xs sm:text-sm mt-1">
              Hasta 50 prompts por batch · {kind === "video" ? "Videos" : "Imágenes"} en paralelo
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Ganancia usuario {(ADMIN_MARGIN_PCT * 100).toFixed(0)}% · Admin a coste
            </span>
            <p className="text-white/35 text-[10px]">
              Sobre coste real Muapi
            </p>
          </div>
        </div>
      </div>

      {/* Config */}
      <div className="glass-card rounded-2xl border border-white/10 p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Model */}
          <div className="sm:col-span-3">
            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">
              Modelo aplicado a TODO el batch
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={isLaunching || workingCount > 0}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-fuchsia-500/40 disabled:opacity-50"
            >
              {Array.from(new Set(models.map((m) => m.category))).map((cat) => (
                <optgroup key={cat} label={cat} className="bg-[#0f1219]">
                  {models.filter((m) => m.category === cat).map((m) => (
                    <option key={m.slug} value={m.slug} className="bg-[#0f1219]">
                      {m.label} · {m.priceHint}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {kind === "video" && (
            <>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Duración</label>
                <select value={duration} onChange={(e) => setDuration(+e.target.value)} disabled={isLaunching || workingCount > 0}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/40 disabled:opacity-50">
                  {[3, 5, 10, 15].map((n) => <option key={n} value={n} className="bg-[#0f1219]">{n} seg</option>)}
                </select>
              </div>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Aspect</label>
                <select value={aspect} onChange={(e) => setAspect(e.target.value)} disabled={isLaunching || workingCount > 0}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/40 disabled:opacity-50">
                  <option value="16:9" className="bg-[#0f1219]">16:9 horizontal</option>
                  <option value="9:16" className="bg-[#0f1219]">9:16 vertical</option>
                  <option value="1:1"  className="bg-[#0f1219]">1:1 cuadrado</option>
                </select>
              </div>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Total prompts</label>
                <div className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold">
                  {activeCount} / {rows.length}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Imagen de origen para TODO el batch (image-to-video) ── */}
        <div className="pt-2">
          <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <ImagePlus className="w-3 h-3" />
            Imagen de origen {needsImage ? <span className="text-pink-400">· requerida para este modelo</span> : <span className="text-white/30">· opcional · se aplica a todo el batch</span>}
          </label>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleImageUpload} className="hidden" />
          {sourceImage ? (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sourceImage.dataUrl} alt="origen" className="w-12 h-12 rounded-lg object-cover ring-1 ring-white/15 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold truncate">{sourceImage.name}</p>
                <p className="text-green-400 text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Cargada · se usa en los {activeCount} prompts</p>
              </div>
              <button onClick={() => fileInputRef.current?.click()} disabled={isLaunching || workingCount > 0} className="text-white/55 hover:text-white text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50">Cambiar</button>
              <button onClick={() => setSourceImage(null)} disabled={isLaunching || workingCount > 0} className="w-7 h-7 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-white/45 hover:text-red-400 transition-colors disabled:opacity-50" aria-label="Quitar"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} disabled={isLaunching || workingCount > 0}
              className={`w-full flex items-center justify-center gap-2.5 border-2 border-dashed rounded-xl py-3.5 transition-colors disabled:opacity-50 ${needsImage ? "border-pink-500/40 bg-pink-500/5 hover:bg-pink-500/10 text-pink-300" : "border-white/15 bg-white/[0.02] hover:bg-white/5 text-white/60"}`}>
              <Upload className="w-5 h-5" />
              <div className="text-left">
                <p className="text-sm font-bold">Subir imagen desde tu PC</p>
                <p className="text-[10px] opacity-70">JPG, PNG o WebP · máx 3MB · se aplica a todo el batch</p>
              </div>
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button onClick={addRow} disabled={rows.length >= 50}
            className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Añadir fila
          </button>
          <button onClick={loadSamples}
            className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            <Wand2 className="w-3.5 h-3.5" /> Cargar ejemplos
          </button>
          <button onClick={pasteCSV}
            className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            <Upload className="w-3.5 h-3.5" /> Pegar lista
          </button>
          <button onClick={clearAll}
            className="inline-flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ml-auto">
            <Trash2 className="w-3.5 h-3.5" /> Limpiar
          </button>
        </div>
      </div>

      {/* Cost preview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl border border-orange-500/20 p-3">
          <p className="text-orange-400 text-[10px] font-bold uppercase tracking-wider">Coste Muapi</p>
          <p className="text-white font-black text-lg sm:text-xl">${totalReal.toFixed(2)}</p>
          <p className="text-white/35 text-[10px]">${realCost.toFixed(4)}/gen</p>
        </div>
        <div className="glass-card rounded-xl border border-cyan-500/20 p-3">
          <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider">Precio cliente</p>
          <p className="text-white font-black text-lg sm:text-xl">${totalCustomer.toFixed(2)}</p>
          <p className="text-white/35 text-[10px]">${customerPrice.toFixed(4)}/gen</p>
        </div>
        <div className="glass-card rounded-xl border border-green-500/30 p-3 bg-green-500/5">
          <p className="text-green-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-2.5 h-2.5" /> Tu ganancia
          </p>
          <p className="text-green-300 font-black text-lg sm:text-xl">${totalProfit.toFixed(2)}</p>
          <p className="text-white/35 text-[10px]">${adminProfit.toFixed(4)}/gen</p>
        </div>
      </div>

      {/* Prompts list */}
      <div className="glass-card rounded-2xl border border-white/10 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-fuchsia-400" />
            Prompts ({activeCount}/{rows.length})
          </h3>
          {workingCount > 0 && (
            <span className="text-yellow-400 text-xs font-bold flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              {workingCount} procesando · {successCount} ok · {failedCount} fail
            </span>
          )}
        </div>

        <div className="space-y-2 max-h-[480px] overflow-y-auto scrollbar-hide pr-1">
          {rows.map((row, i) => (
            <RowItem
              key={row.id}
              index={i + 1}
              row={row}
              onPromptChange={(v) => updatePrompt(row.id, v)}
              onRemove={() => removeRow(row.id)}
              disabled={isLaunching || workingCount > 0}
            />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={launchBatch}
          disabled={activeCount === 0 || isLaunching || workingCount > 0 || (needsImage && !sourceImage)}
          className="shine-btn inline-flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-95 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-fuchsia-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLaunching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Lanzar {activeCount} {kind === "video" ? "videos" : "imágenes"}
        </button>
        <button
          onClick={exportResults}
          disabled={successCount === 0}
          className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" /> Exportar CSV ({successCount} resultados)
        </button>
      </div>

      {/* Real-time profit tracker */}
      {successCount > 0 && (
        <div className="glass-card rounded-2xl border border-green-500/30 p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-1">💰 Ganancia generada en este batch</p>
              <p className="text-white font-black text-2xl sm:text-3xl">${realProfit.toFixed(2)} <span className="text-white/40 text-sm">/ {successCount} jobs OK</span></p>
            </div>
            <div className="text-right">
              <p className="text-white/55 text-xs">Coste real Muapi: ${(getRealCostUSD(model) * successCount).toFixed(2)}</p>
              <p className="text-white/55 text-xs">Precio cliente: ${(getCustomerPriceUSD(model) * successCount).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RowItem({ index, row, onPromptChange, onRemove, disabled }: {
  index: number;
  row: PromptRow;
  onPromptChange: (v: string) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const job = row.job;
  const statusChip = () => {
    if (job.status === "idle") return null;
    if (job.status === "queued" || job.status === "pending") return <span className="text-yellow-400 text-[10px] font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />En cola</span>;
    if (job.status === "processing") return <span className="text-cyan-400 text-[10px] font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Procesando</span>;
    if (job.status === "completed" || job.status === "succeeded") return <span className="text-green-400 text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Listo</span>;
    if (job.status === "failed" || job.status === "cancelled") return <span className="text-red-400 text-[10px] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" />Falló</span>;
    return null;
  };

  const output = (job.status === "completed" || job.status === "succeeded") ? (job as { output: string[] }).output : [];

  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-3 space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-white/35 text-[10px] font-mono w-6 flex-shrink-0 pt-2">{String(index).padStart(2, "0")}</span>
        <input
          value={row.prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={disabled}
          placeholder="Describe la imagen o video..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-fuchsia-500/40 disabled:opacity-50"
        />
        <button onClick={onRemove} disabled={disabled} className="w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-white/40 hover:text-red-400 transition-colors disabled:opacity-50">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {(statusChip() || output.length > 0) && (
        <div className="pl-8 flex items-center gap-3 flex-wrap">
          {statusChip()}
          {(job.status === "failed" || job.status === "cancelled") && (
            <span className="text-red-200/60 text-[10px] truncate">{(job as { error: string }).error}</span>
          )}
          {output.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 text-[10px] font-bold inline-flex items-center gap-1">
              <Download className="w-2.5 h-2.5" /> Resultado {i + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
