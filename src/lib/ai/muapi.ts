/**
 * Muapi.ai client — Image & Video generation
 *
 * Base URL: https://api.muapi.ai
 * Auth: header `x-api-key: ${MUAPI_API_KEY}`
 *
 * Endpoints reales (verificado desde openapi.json):
 *   POST /api/v1/{model-name}                       → inicia job (devuelve request_id)
 *   GET  /api/v1/predictions/{id}/result            → polling de status
 *
 * Server-side only. NEVER importar desde "use client".
 * El catálogo de modelos vive en ./muapi-models (client-safe).
 */
import { getIntegration } from "@/lib/integrations";

const MUAPI_BASE_URL_DEFAULT = "https://api.muapi.ai";

export interface MuapiGenerateRequest {
  /** Model slug, e.g. "flux-dev-image", "veo3-text-to-video" */
  model: string;
  /** Prompt de texto */
  prompt: string;
  /** Imagen base (URL) para image-to-video / image-to-image */
  image?: string;
  /** Image: ancho px */
  width?: number;
  /** Image: alto px */
  height?: number;
  /** Video: duración segundos */
  duration?: number;
  /** Video: aspect ratio "16:9" | "9:16" | "1:1" */
  aspect_ratio?: string;
  /** Seed para reproducibilidad */
  seed?: number;
  /** Steps */
  steps?: number;
  /** Extras */
  extra?: Record<string, unknown>;
}

export interface MuapiJob {
  /** id del request — usado para polling */
  id: string;
  /** Muapi devuelve "queued" | "pending" | "processing" | "completed" | "failed" | "cancelled" */
  status: "queued" | "pending" | "processing" | "completed" | "succeeded" | "failed" | "cancelled" | "canceled";
  model?: string;
  created_at?: string;
  /** URL(s) del output cuando completed */
  output?: string | string[];
  /** Algunos modelos devuelven `result_url` o `urls` */
  result_url?: string;
  urls?: string[];
  /** Mensaje de error si failed */
  error?: string;
  /** Cost en créditos */
  cost?: number;
}

class MuapiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = "MuapiError";
  }
}

/**
 * Resuelve credenciales de MUAPI: primero la integración guardada en BD
 * (panel /integrations) y, si no hay, cae al env. getIntegration ya hace
 * ese fallback internamente.
 */
async function resolveMuapi(): Promise<{ apiKey: string; baseUrl: string }> {
  const integ = await getIntegration("muapi");
  if (!integ?.apiKey) {
    throw new MuapiError(
      500,
      "MUAPI no está configurada. Conéctala en el panel /integrations o define MUAPI_API_KEY en el entorno."
    );
  }
  return { apiKey: integ.apiKey, baseUrl: integ.baseUrl || MUAPI_BASE_URL_DEFAULT };
}

async function muapiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiKey, baseUrl } = await resolveMuapi();
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let body: unknown;
  try { body = text ? JSON.parse(text) : undefined; } catch { body = text; }

  if (!res.ok) {
    // Muapi puede devolver: {detail: {error: {code, message, topup_url, ...}}} o {error: "msg"}
    const b = body as Record<string, unknown> | null | undefined;
    const detail = b?.detail as Record<string, unknown> | string | undefined;
    const detailErr = (detail && typeof detail === "object" ? (detail as Record<string, unknown>).error : undefined) as Record<string, unknown> | undefined;
    const message =
      (detailErr?.message as string | undefined) ??
      (typeof detail === "string" ? detail : undefined) ??
      (b?.error as string | undefined) ??
      `Muapi error ${res.status}`;
    throw new MuapiError(res.status, message, body);
  }

  return body as T;
}

/** Normaliza el response porque Muapi devuelve `outputs` (plural), algunos usan `output`, `urls`, `result_url`... */
function normalizeJob(raw: Record<string, unknown>): MuapiJob {
  const id = String(raw.id ?? raw.request_id ?? raw.requestId ?? raw.predictionId ?? "");
  const status = (raw.status ?? "queued") as MuapiJob["status"];

  // Muapi real shape: { outputs: ["https://cdn.muapi.ai/.../file.png"] }
  // Otros providers usan: output, result_url, urls
  const outputs = (raw.outputs ?? raw.output ?? raw.result_url ?? raw.result) as string | string[] | undefined;

  return {
    id,
    status,
    model: raw.model as string | undefined,
    created_at: raw.created_at as string | undefined,
    output: outputs,
    result_url: raw.result_url as string | undefined,
    urls: raw.urls as string[] | undefined,
    error: (raw.error && raw.error !== "") ? (raw.error as string) : undefined,
    cost: raw.cost as number | undefined,
  };
}

/**
 * POST /api/v1/{model} — inicia job de generación.
 * Body: { prompt, width, height, duration, etc. } sin "model" field (es en URL).
 */
export async function createGeneration(req: MuapiGenerateRequest): Promise<MuapiJob> {
  const { model, ...input } = req;
  if (!model) throw new MuapiError(400, "model requerido");

  const raw = await muapiFetch<Record<string, unknown>>(
    `/api/v1/${encodeURIComponent(model)}`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
  return normalizeJob(raw);
}

/**
 * GET /api/v1/predictions/{id}/result — polling.
 */
export async function getJob(id: string): Promise<MuapiJob> {
  const raw = await muapiFetch<Record<string, unknown>>(
    `/api/v1/predictions/${encodeURIComponent(id)}/result`,
    { method: "GET" }
  );
  return normalizeJob(raw);
}

/**
 * Polling helper.
 */
export async function waitForJob(id: string, opts?: { timeoutMs?: number; intervalMs?: number }): Promise<MuapiJob> {
  const timeoutMs = opts?.timeoutMs ?? 5 * 60 * 1000;
  const intervalMs = opts?.intervalMs ?? 2000;
  const deadline = Date.now() + timeoutMs;
  const TERMINAL = new Set(["completed", "succeeded", "failed", "cancelled", "canceled"]);

  while (Date.now() < deadline) {
    const job = await getJob(id);
    if (TERMINAL.has(job.status)) return job;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new MuapiError(408, `Timeout esperando job ${id}`);
}

/* ─────────────────────────────────────────────
   Catálogo de modelos — re-exportado desde muapi-models (client-safe)
   ───────────────────────────────────────────── */
export { MUAPI_MODELS } from "./muapi-models";
export type { MuapiImageModel, MuapiVideoModel } from "./muapi-models";

export { MuapiError };
