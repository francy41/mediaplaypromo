"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Clapperboard, Wand2, Loader2, Download, RefreshCw, Plus, AlertCircle, CheckCircle2, Clock, FolderInput, Film } from "lucide-react";
import { MUAPI_MODELS } from "@/lib/ai/muapi-models";

const SECRET_STORE = "mpp_license_admin_secret";
const PRODUCTION_QUEUE = "mpp_production_queue";
const STUDIO_META = "mpp_studio_meta";

const DURATIONS = [
  { label: "30s", sec: 30 }, { label: "1 min", sec: 60 }, { label: "2 min", sec: 120 },
  { label: "5 min", sec: 300 }, { label: "10 min", sec: 600 },
];
const ASPECTS = [
  { v: "9:16", label: "9:16 Vertical" }, { v: "16:9", label: "16:9 Horizontal" }, { v: "1:1", label: "1:1 Cuadrado" },
];
const VOICES = [
  { v: "mx:Spanish_SereneWoman", label: "⭐ Español · Serena (F) · MUAPI" },
  { v: "mx:Spanish_ThoughtfulMan", label: "⭐ Español · Reflexivo (M) · MUAPI" },
  { v: "mx:Spanish_Kind-heartedGirl", label: "⭐ Español · Amable (F) · MUAPI" },
  { v: "mx:Spanish_PassionateWarrior", label: "⭐ Español · Enérgico (M) · MUAPI" },
  { v: "mx:English_Graceful_Lady", label: "⭐ English · Graceful (F) · MUAPI" },
  { v: "mx:English_Trustworthy_Man", label: "⭐ English · Trustworthy (M) · MUAPI" },
  { v: "es", label: "🆓 Español · Google (gratis)" },
  { v: "en", label: "🆓 English · Google (gratis)" },
];

interface Scene { narration: string; query: string; visual: string; seconds: number }
type St = "queued" | "generating" | "done" | "error";
interface Job { id: string; scene: Scene; status: St; clipUrl?: string; error?: string }

export default function StudioPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [prompt, setPrompt] = useState("");
  const [durationSec, setDurationSec] = useState(60);
  const [model, setModel] = useState("wan2.2-5b-fast-t2v");
  const [voice, setVoice] = useState("mx:Spanish_SereneWoman");
  const [aspect, setAspect] = useState("9:16");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    let s = ""; try { s = localStorage.getItem(SECRET_STORE) ?? ""; } catch {}
    const t = setTimeout(() => setSecret(s), 0);
    return () => clearTimeout(t);
  }, []);

  const lang: "es" | "en" = (voice.startsWith("es") || voice.toLowerCase().includes("spanish")) ? "es" : "en";
  const flashMsg = (m: string) => { setFlash(m); setTimeout(() => setFlash(""), 2500); };

  const genClip = useCallback(async (visual: string): Promise<{ url?: string; error?: string }> => {
    try {
      const r = await fetch("/api/ai/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "muapi", model, prompt: visual, aspect_ratio: aspect, duration: 5 }) });
      const job = await r.json();
      if (job.error || !job.id) return { error: String(job?.details?.error?.code === "INSUFFICIENT_CREDITS" ? "Sin saldo MUAPI (recarga en muapi.ai/topup)" : job?.details?.detail || job?.error || "MUAPI no disponible") };
      const OK = ["completed", "succeeded"], FAIL = ["failed", "cancelled", "canceled"];
      if (OK.includes(job.status)) { const u = Array.isArray(job.output) ? job.output[0] : job.output; if (u) return { url: u }; }
      for (let i = 0; i < 120; i++) {
        await new Promise((res) => setTimeout(res, 3000));
        const sr = await fetch(`/api/ai/status/${encodeURIComponent(job.id)}`);
        const st = await sr.json().catch(() => ({}));
        if (OK.includes(st.status)) { const u = (Array.isArray(st.output) ? st.output[0] : st.output) || (Array.isArray(st.urls) ? st.urls[0] : st.result_url); return u ? { url: u } : { error: "sin salida" }; }
        if (FAIL.includes(st.status)) return { error: st.error || "falló la generación" };
      }
      return { error: "timeout" };
    } catch (e) { return { error: e instanceof Error ? e.message : "error" }; }
  }, [model, aspect]);

  const runScene = useCallback(async (jobId: string, visual: string) => {
    setJobs((p) => p.map((j) => j.id === jobId ? { ...j, status: "generating", error: undefined } : j));
    const res = await genClip(visual);
    setJobs((p) => p.map((j) => j.id === jobId ? (res.url ? { ...j, status: "done", clipUrl: res.url } : { ...j, status: "error", error: res.error }) : j));
  }, [genClip]);

  const generate = async () => {
    if (!prompt.trim()) return;
    if (!secret) { setError("No estás autenticado. Entra primero en el Editor o Planificador (guarda tu sesión)."); return; }
    setBusy(true); setError(null); setJobs([]);
    try {
      const r = await fetch("/api/admin/editor/plan", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": secret }, body: JSON.stringify({ prompt, durationSec, lang }) });
      if (r.status === 401) { setError("Secreto incorrecto. Vuelve a entrar en el Editor/Planificador."); return; }
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      const scenes: Scene[] = (d.scenes ?? []).map((s: { narration?: string; query?: string; visual?: string; seconds?: number }) => ({ narration: s.narration || "", query: s.query || "", visual: s.visual || s.query || "", seconds: s.seconds || 5 }));
      if (scenes.length === 0) { setError("El guión salió vacío. Prueba con otro tema."); return; }
      const initial: Job[] = scenes.map((s, i) => ({ id: `j${Date.now()}-${i}`, scene: s, status: "queued" }));
      setJobs(initial);
      const CONC = 3; let idx = 0;
      const worker = async () => { while (idx < initial.length) { const my = idx++; await runScene(initial[my].id, initial[my].scene.visual); } };
      await Promise.all(Array.from({ length: Math.min(CONC, initial.length) }, () => worker()));
    } catch { setError("Error de conexión."); }
    finally { setBusy(false); }
  };

  const download = async (url: string, name: string) => {
    try { const r = await fetch(url); const b = await r.blob(); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; a.click(); URL.revokeObjectURL(a.href); } catch { window.open(url, "_blank"); }
  };

  const pushToQueue = (items: { url: string; narration: string; seconds: number }[]) => {
    let q: unknown[] = []; try { q = JSON.parse(localStorage.getItem(PRODUCTION_QUEUE) || "[]"); } catch {}
    for (const it of items) q.push({ type: "video", thumb: it.url, url: it.url, narration: it.narration, seconds: it.seconds });
    try { localStorage.setItem(PRODUCTION_QUEUE, JSON.stringify(q)); localStorage.setItem(STUDIO_META, JSON.stringify({ voice, aspect })); localStorage.setItem("mpp_studio_autoimport", "1"); } catch {}
  };

  const addOne = (job: Job) => {
    if (!job.clipUrl) return;
    pushToQueue([{ url: job.clipUrl, narration: job.scene.narration, seconds: job.scene.seconds }]);
    flashMsg("✓ Añadido. Se cargará solo al abrir el editor (o pulsa 'Añadir todo al editor').");
  };

  const addAllAndGo = () => {
    const done = jobs.filter((j) => j.status === "done" && j.clipUrl);
    if (done.length === 0) { flashMsg("No hay clips listos aún."); return; }
    pushToQueue(done.map((j) => ({ url: j.clipUrl!, narration: j.scene.narration, seconds: j.scene.seconds })));
    router.push("/editor");
  };

  const doneCount = jobs.filter((j) => j.status === "done").length;
  const models = MUAPI_MODELS.video;

  return (
    <AdminShell
      title="Estudio de Guión IA"
      description="Elige tema, duración, modelo de video y voz → genera un guión consistente y sus clips de video IA."
      icon={Clapperboard}
      iconGradient="from-violet-500 to-fuchsia-600"
      status="beta"
      breadcrumb={[{ label: "Estudio" }]}
      actions={jobs.length > 0 && (
        <button onClick={addAllAndGo} disabled={doneCount === 0} className="shine-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-violet-500/30 disabled:opacity-50">
          <FolderInput className="w-4 h-4" /> Añadir todo al editor ({doneCount})
        </button>
      )}
    >
      <div className="space-y-4">
        {/* Configuración */}
        <div className="glass-card rounded-2xl border border-violet-500/25 bg-violet-500/[0.03] p-5 space-y-4">
          <div>
            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Tema / idea del video</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} placeholder="Ej: Zapatillas Nike originales para corredores, beneficios y oferta de YF Sport Shop" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/40 resize-none" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Duración</label>
              <div className="flex flex-wrap gap-1.5">
                {DURATIONS.map((d) => (
                  <button key={d.sec} onClick={() => setDurationSec(d.sec)} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${durationSec === d.sec ? "bg-violet-500/25 text-violet-200 border border-violet-500/40" : "bg-white/5 text-white/50 border border-white/10"}`}>{d.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Modelo de video (MUAPI)</label>
              <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/40">
                {models.map((m) => <option key={m.slug} value={m.slug} className="bg-[#0f1219]">{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Voz del narrador</label>
              <select value={voice} onChange={(e) => setVoice(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/40">
                {VOICES.map((v) => <option key={v.v} value={v.v} className="bg-[#0f1219]">{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Formato</label>
              <select value={aspect} onChange={(e) => setAspect(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/40">
                {ASPECTS.map((a) => <option key={a.v} value={a.v} className="bg-[#0f1219]">{a.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={generate} disabled={busy || !prompt.trim()} className="shine-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-violet-500/30 disabled:opacity-50">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando…</> : <><Wand2 className="w-4 h-4" /> Generar guión + clips</>}
            </button>
            {flash && <span className="text-xs text-emerald-300 font-semibold">{flash}</span>}
            {error && <span className="inline-flex items-center gap-1 text-xs text-red-400"><AlertCircle className="w-3.5 h-3.5" /> {error}</span>}
          </div>
          <p className="text-white/35 text-[10px]">⚠️ Cada clip usa <b>video IA de MUAPI</b> (gasta tu saldo). El guión y la voz se aplican al añadir al editor.</p>
        </div>

        {/* Galería en proceso */}
        {jobs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {jobs.map((j, i) => (
              <div key={j.id} className="glass-card rounded-2xl border border-white/10 overflow-hidden flex flex-col">
                <div className={`relative bg-black/40 flex items-center justify-center ${aspect === "9:16" ? "aspect-[9/16]" : aspect === "1:1" ? "aspect-square" : "aspect-video"}`}>
                  {j.status === "done" && j.clipUrl ? (
                    <video src={j.clipUrl} controls loop muted className="w-full h-full object-cover" />
                  ) : j.status === "error" ? (
                    <div className="text-center p-3"><AlertCircle className="w-7 h-7 text-red-400 mx-auto mb-1" /><p className="text-red-300 text-[11px]">{j.error || "Error"}</p></div>
                  ) : j.status === "generating" ? (
                    <div className="text-center"><Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" /><p className="text-violet-300 text-[11px] mt-1 font-semibold">Generando video IA…</p></div>
                  ) : (
                    <div className="text-center"><Clock className="w-7 h-7 text-white/40 mx-auto" /><p className="text-white/40 text-[11px] mt-1">En cola</p></div>
                  )}
                  <span className="absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-full bg-black/60 text-white/80">Escena {i + 1}</span>
                  {j.status === "done" && <span className="absolute top-2 right-2"><CheckCircle2 className="w-5 h-5 text-emerald-400" /></span>}
                </div>
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <p className="text-white/70 text-[11px] leading-snug line-clamp-3">{j.scene.narration || j.scene.visual}</p>
                  <div className="flex items-center gap-1.5 mt-auto flex-wrap">
                    <button onClick={() => runScene(j.id, j.scene.visual)} disabled={j.status === "generating"} className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[10px] font-bold px-2 py-1.5 rounded-lg disabled:opacity-40" title="Regenerar"><RefreshCw className="w-3 h-3" /> Regenerar</button>
                    {j.status === "done" && j.clipUrl && (
                      <>
                        <button onClick={() => download(j.clipUrl!, `escena-${i + 1}.mp4`)} className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[10px] font-bold px-2 py-1.5 rounded-lg" title="Descargar"><Download className="w-3 h-3" /> Descargar</button>
                        <button onClick={() => addOne(j)} className="inline-flex items-center gap-1 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-200 text-[10px] font-bold px-2 py-1.5 rounded-lg" title="Añadir al editor"><Plus className="w-3 h-3" /> Editor</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {jobs.length === 0 && !busy && (
          <div className="glass-card rounded-2xl border border-white/10 p-10 text-center">
            <Film className="w-10 h-10 text-white/25 mx-auto mb-3" />
            <p className="text-white/50 text-sm">Escribe un tema arriba y pulsa <b className="text-white/80">Generar</b>. Verás cada escena generarse aquí como un clip de video IA.</p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
