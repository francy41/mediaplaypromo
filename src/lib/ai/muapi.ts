/**
 * Muapi.ai client — Image & Video generation
 *
 * Base URL: https://api.muapi.ai (verifica en https://muapi.ai/docs/introduction)
 * Auth: Authorization: Bearer ${MUAPI_API_KEY}
 *
 * Server-side only. NEVER importar desde "use client".
 */

const MUAPI_BASE_URL = process.env.MUAPI_BASE_URL || "https://api.muapi.ai";

export interface MuapiGenerateRequest {
  /** Model slug, e.g. "flux-dev", "google-imagen4", "openai-sora-2-text-to-video" */
  model: string;
  /** Prompt de texto */
  prompt: string;
  /** Imagen base (URL) para image-to-video / image-to-image */
  image?: string;
  /** Negative prompt */
  negative_prompt?: string;
  /** Image: ancho px (ej. 1024) */
  width?: number;
  /** Image: alto px (ej. 1024) */
  height?: number;
  /** Image: cantidad a generar */
  num_images?: number;
  /** Video: duración segundos */
  duration?: number;
  /** Video: aspect ratio "16:9" | "9:16" | "1:1" */
  aspect_ratio?: string;
  /** Seed para reproducibilidad */
  seed?: number;
  /** Steps de inferencia */
  steps?: number;
  /** Guidance scale */
  guidance_scale?: number;
  /** Extras provider-specific */
  extra?: Record<string, unknown>;
}

export interface MuapiJob {
  id: string;
  status: "queued" | "processing" | "succeeded" | "failed" | "canceled";
  model: string;
  created_at: string;
  /** URL(s) del output cuando succeeded */
  output?: string | string[];
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

function getApiKey(): string {
  const key = process.env.MUAPI_API_KEY;
  if (!key) {
    throw new MuapiError(500, "MUAPI_API_KEY env var no configurada. Añádela en Vercel → Settings → Environment Variables");
  }
  return key;
}

async function muapiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${MUAPI_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
      ...(init?.headers ?? {}),
    },
    // Cache disabled for AI generation requests
    cache: "no-store",
  });

  const text = await res.text();
  let body: unknown;
  try { body = text ? JSON.parse(text) : undefined; } catch { body = text; }

  if (!res.ok) {
    const message = (body && typeof body === "object" && "error" in body)
      ? String((body as { error: unknown }).error)
      : `Muapi error ${res.status}`;
    throw new MuapiError(res.status, message, body);
  }

  return body as T;
}

/**
 * Inicia un job de generación (image, video, etc).
 * Muapi típicamente es asíncrono: devuelve un job_id y haces polling con getJob().
 */
export async function createGeneration(req: MuapiGenerateRequest): Promise<MuapiJob> {
  return muapiFetch<MuapiJob>("/v1/predictions", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

/**
 * Consulta el estado de un job.
 */
export async function getJob(id: string): Promise<MuapiJob> {
  return muapiFetch<MuapiJob>(`/v1/predictions/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

/**
 * Cancela un job en cola/processing.
 */
export async function cancelJob(id: string): Promise<MuapiJob> {
  return muapiFetch<MuapiJob>(`/v1/predictions/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
  });
}

/**
 * Polling helper: espera hasta que el job termine (o falle / timeout).
 */
export async function waitForJob(id: string, opts?: { timeoutMs?: number; intervalMs?: number }): Promise<MuapiJob> {
  const timeoutMs = opts?.timeoutMs ?? 5 * 60 * 1000;   // 5 min default
  const intervalMs = opts?.intervalMs ?? 2000;          // 2s polling
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const job = await getJob(id);
    if (job.status === "succeeded" || job.status === "failed" || job.status === "canceled") {
      return job;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new MuapiError(408, `Timeout esperando job ${id}`);
}

/* ─────────────────────────────────────────────
   Catálogo de modelos (subset — añade más según veas)
   ───────────────────────────────────────────── */

export const MUAPI_MODELS = {
  image: [
    { slug: "flux-dev",            label: "Flux Dev",        category: "Image", priceHint: "$" },
    { slug: "google-imagen4",      label: "Imagen 4",        category: "Image", priceHint: "$$" },
    { slug: "ideogram-v3-t2i",     label: "Ideogram v3",     category: "Image", priceHint: "$$" },
    { slug: "wan2.1-text-to-image",label: "Wan 2.1",         category: "Image", priceHint: "$" },
  ],
  video: [
    { slug: "openai-sora-2-text-to-video", label: "Sora 2 (10s)",  category: "Video T2V", priceHint: "$$$" },
    { slug: "veo3-text-to-video",          label: "Veo 3",         category: "Video T2V", priceHint: "$$$" },
    { slug: "kling-v3.0-pro-text-to-video",label: "Kling 3 Pro",   category: "Video T2V", priceHint: "$$$" },
    { slug: "veo3-image-to-video",         label: "Veo 3 I2V",     category: "Video I2V", priceHint: "$$$" },
    { slug: "runway-image-to-video",       label: "Runway I2V",    category: "Video I2V", priceHint: "$$$" },
  ],
} as const;

export type MuapiImageModel = (typeof MUAPI_MODELS.image)[number]["slug"];
export type MuapiVideoModel = (typeof MUAPI_MODELS.video)[number]["slug"];

export { MuapiError };
