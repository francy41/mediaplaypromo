import "server-only";
import { getIntegration } from "@/lib/integrations";
import { createGeneration as muapiCreate, getJob as muapiGetJob } from "@/lib/ai/muapi";

/**
 * Router multi-proveedor de generación de video/imagen.
 *
 * El job id codifica el proveedor y el modelo para poder hacer polling con la
 * API correcta:  `provider::model::rawId`.  Los ids antiguos sin `::` se tratan
 * como MUAPI (retrocompatibilidad).
 *
 * Server-only — nunca importar desde "use client".
 */

export interface GenJob {
  id: string;
  status: string;
  output?: string[];
  error?: string;
}

export interface GenInput {
  prompt: string;
  image?: string;
  image_url?: string;
  width?: number;
  height?: number;
  duration?: number;
  aspect_ratio?: string;
  resolution?: string;
  [k: string]: unknown;
}

const toArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter(Boolean) as string[] : v ? [v as string] : []);

function parseId(jobId: string): { provider: string; model: string; rawId: string } {
  const parts = jobId.split("::");
  if (parts.length >= 3) return { provider: parts[0], model: parts[1], rawId: parts.slice(2).join("::") };
  return { provider: "muapi", model: "", rawId: jobId }; // ids antiguos = muapi
}

async function keyFor(provider: string, fallbackBase: string): Promise<{ key: string; base: string }> {
  const i = await getIntegration(provider);
  if (!i?.apiKey) {
    throw new Error(`Conecta ${provider} en Integraciones API (/integrations) para usar este proveedor.`);
  }
  return { key: i.apiKey, base: (i.baseUrl || fallbackBase).replace(/\/+$/, "") };
}

/* ───────────────────────── fal.ai (queue API) ───────────────────────── */

function normFal(s?: string): string {
  switch ((s || "").toUpperCase()) {
    case "IN_QUEUE": return "queued";
    case "IN_PROGRESS": return "processing";
    case "COMPLETED": return "completed";
    default: return "queued";
  }
}

async function falCreate(model: string, input: GenInput): Promise<GenJob> {
  const { key } = await keyFor("fal", "https://queue.fal.run");
  const body: Record<string, unknown> = { prompt: input.prompt };
  if (input.aspect_ratio) body.aspect_ratio = input.aspect_ratio;
  const img = input.image_url || input.image;
  if (img) body.image_url = img;

  const res = await fetch(`https://queue.fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok) {
    const d = data as Record<string, unknown>;
    const detail = d.detail;
    const msg = Array.isArray(detail) ? (detail[0] as { msg?: string })?.msg : (typeof detail === "string" ? detail : (d.error as string));
    throw new Error(msg || `fal error ${res.status}`);
  }
  const reqId = (data as Record<string, string>).request_id;
  return { id: `fal::${model}::${reqId}`, status: normFal((data as Record<string, string>).status) };
}

async function falStatus(model: string, reqId: string, fullId: string): Promise<GenJob> {
  const { key } = await keyFor("fal", "https://queue.fal.run");
  const st = await fetch(`https://queue.fal.run/${model}/requests/${reqId}/status`, { headers: { Authorization: `Key ${key}` }, cache: "no-store" });
  const sd = await st.json().catch(() => ({} as Record<string, unknown>));
  const status = normFal((sd as Record<string, string>).status);
  if (status !== "completed") return { id: fullId, status };

  const rr = await fetch(`https://queue.fal.run/${model}/requests/${reqId}`, { headers: { Authorization: `Key ${key}` }, cache: "no-store" });
  const rd = await rr.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>;
  const video = rd.video as { url?: string } | undefined;
  const out = rd.output as { url?: string; video?: { url?: string } } | string | string[] | undefined;
  const url =
    video?.url ??
    (rd.video_url as string | undefined) ??
    (typeof out === "string" ? out : Array.isArray(out) ? out[0] : (out?.video?.url ?? out?.url));
  return { id: fullId, status: "completed", output: toArr(url) };
}

/* ───────────────────────── Replicate ───────────────────────── */

function normRep(s?: string): string {
  switch ((s || "").toLowerCase()) {
    case "starting": return "queued";
    case "processing": return "processing";
    case "succeeded": return "succeeded";
    case "failed": return "failed";
    case "canceled": return "cancelled";
    default: return "queued";
  }
}

async function replicateCreate(model: string, input: GenInput): Promise<GenJob> {
  const { key } = await keyFor("replicate", "https://api.replicate.com");
  const reqInput: Record<string, unknown> = { prompt: input.prompt };
  if (input.image) reqInput.image = input.image;
  const res = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: reqInput }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>;
  if (!res.ok) throw new Error((data.detail as string) || (data.error as string) || `Replicate error ${res.status}`);
  return { id: `replicate::${model}::${data.id}`, status: normRep(data.status as string) };
}

async function replicateStatus(predId: string, fullId: string): Promise<GenJob> {
  const { key } = await keyFor("replicate", "https://api.replicate.com");
  const r = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
  const d = await r.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>;
  return {
    id: fullId,
    status: normRep(d.status as string),
    output: toArr(d.output),
    error: (d.error as string) || undefined,
  };
}

/* ───────────────────────── NVIDIA (imagen, síncrono) ───────────────────────── */

async function nvidiaCreate(model: string, input: GenInput): Promise<GenJob> {
  const { key } = await keyFor("nvidia", "https://ai.api.nvidia.com");
  // El genai endpoint no usa la base OpenAI; siempre ai.api.nvidia.com.
  const isKontext = /kontext|canny|depth/.test(model);
  const ref = input.image || input.image_url;
  const body: Record<string, unknown> = { prompt: input.prompt };
  if (isKontext) {
    // FLUX Kontext: imagen de referencia (base64 sin prefijo data:) + dimensiones del set permitido.
    if (ref) body.image = String(ref).replace(/^data:[^,]+,/, "");
    body.width = Number(input.width) || 1024;
    body.height = Number(input.height) || 1024;
  } else {
    body.width = Math.min(Number(input.width) || 1024, 1024);
    body.height = Math.min(Number(input.height) || 1024, 1024);
    if (/schnell/.test(model)) body.steps = 4;
  }
  if (typeof input.seed === "number") body.seed = input.seed;

  const res = await fetch(`https://ai.api.nvidia.com/v1/genai/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error((data.detail as string) || (data.message as string) || (data.title as string) || `NVIDIA error ${res.status}`);
  }
  const art = (data.artifacts as Array<{ base64?: string }> | undefined)?.[0];
  const b64 = art?.base64 || (data.image as string | undefined);
  if (!b64) throw new Error("NVIDIA no devolvió imagen.");
  const mime = b64.startsWith("/9j/") ? "image/jpeg" : b64.startsWith("iVBOR") ? "image/png" : "image/jpeg";
  return { id: `nvidia::${model}::sync`, status: "completed", output: [`data:${mime};base64,${b64}`] };
}

/* ───────────────────────── API pública del router ───────────────────────── */

/** Lanza una generación con el proveedor indicado. Devuelve job con id prefijado. */
export async function createGen(provider: string, model: string, input: GenInput): Promise<GenJob> {
  const p = (provider || "muapi").toLowerCase();
  if (p === "muapi") {
    const job = await muapiCreate({ model, ...input });
    return { id: `muapi::${model}::${job.id}`, status: job.status, output: toArr(job.output) };
  }
  if (p === "fal") return falCreate(model, input);
  if (p === "replicate") return replicateCreate(model, input);
  if (p === "nvidia") return nvidiaCreate(model, input);
  throw new Error(`Proveedor no soportado: ${p}`);
}

/** Consulta el estado de un job (id prefijado o id antiguo de Muapi). */
export async function getGenJob(jobId: string): Promise<GenJob> {
  const { provider, model, rawId } = parseId(jobId);
  if (provider === "fal") return falStatus(model, rawId, jobId);
  if (provider === "replicate") return replicateStatus(rawId, jobId);
  if (provider === "nvidia") return { id: jobId, status: "completed", output: [] }; // síncrono: resultado ya entregado al crear
  // muapi (o id antiguo)
  const j = await muapiGetJob(rawId);
  return { id: jobId, status: j.status, output: toArr(j.output ?? j.urls ?? j.result_url), error: j.error };
}
