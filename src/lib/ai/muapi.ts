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
 */

const MUAPI_BASE_URL = process.env.MUAPI_BASE_URL || "https://api.muapi.ai";

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
      "x-api-key": getApiKey(),
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
   Catálogo de modelos (verificado desde openapi.json)
   ───────────────────────────────────────────── */

/**
 * Catálogo curado de modelos Muapi (los más populares + recomendados).
 * Hay 200+ modelos disponibles; aquí están los TOP para producción.
 */
export const MUAPI_MODELS = {
  image: [
    // Flux family — best quality/cost ratio
    { slug: "flux-schnell-image",        label: "⚡ Flux Schnell (más rápido)",  category: "Image",  priceHint: "$" },
    { slug: "flux-dev-image",            label: "Flux Dev (balanced)",            category: "Image",  priceHint: "$$" },
    { slug: "flux-kontext-dev-t2i",      label: "Flux Kontext Dev",               category: "Image",  priceHint: "$$" },
    // HiDream — high quality
    { slug: "hidream_i1_full_image",     label: "🏆 HiDream Full (mejor calidad)",category: "Image",  priceHint: "$$$" },
    { slug: "hidream_i1_dev_image",      label: "HiDream Dev",                    category: "Image",  priceHint: "$$" },
    { slug: "hidream_i1_fast_image",     label: "HiDream Fast",                   category: "Image",  priceHint: "$" },
    // Otros premium
    { slug: "grok-imagine-text-to-image",label: "🚀 Grok Imagine T2I (xAI)",      category: "Image",  priceHint: "$$$" },
    { slug: "wan2.7-text-to-image-pro",  label: "Wan 2.7 Pro (Alibaba)",          category: "Image",  priceHint: "$$$" },
    { slug: "hunyuan-image-3.0",         label: "Hunyuan 3.0 (Tencent)",          category: "Image",  priceHint: "$$" },
  ],
  video: [
    // ═══════════════════════════════════════════════════════════════
    // 💰 BUDGET — Los más BARATOS para empezar (testing y demos)
    // ═══════════════════════════════════════════════════════════════
    { slug: "wan2.2-5b-fast-t2v",            label: "💎 Wan 2.2 5B Fast ($0.02)",     category: "💰 Budget", priceHint: "¢" },
    { slug: "seedance-lite-t2v",             label: "Seedance Lite ($0.10)",          category: "💰 Budget", priceHint: "¢" },
    { slug: "wan2.5-text-to-video-fast",     label: "Wan 2.5 Fast",                   category: "💰 Budget", priceHint: "$" },
    { slug: "hunyuan-fast-text-to-video",    label: "Hunyuan Fast",                   category: "💰 Budget", priceHint: "$" },
    { slug: "ltx-2-fast-text-to-video",      label: "LTX-2 Fast ($0.31)",             category: "💰 Budget", priceHint: "$" },
    { slug: "minimax-hailuo-2.3-fast",       label: "Hailuo 2.3 Fast",                category: "💰 Budget", priceHint: "$" },
    { slug: "seedance-v1.5-pro-t2v-fast",    label: "Seedance 1.5 Fast",              category: "💰 Budget", priceHint: "$" },

    // ── Google Veo ──
    { slug: "veo3.1-text-to-video",          label: "👑 Veo 3.1 (Google, último)",    category: "Veo",      priceHint: "$$$$" },
    { slug: "veo3.1-fast-text-to-video",     label: "⚡ Veo 3.1 Fast",                category: "Veo",      priceHint: "$$$" },
    { slug: "veo3.1-lite-text-to-video",     label: "Veo 3.1 Lite",                   category: "Veo",      priceHint: "$$" },
    { slug: "veo3-text-to-video",            label: "Veo 3 (balanced)",               category: "Veo",      priceHint: "$$$" },
    { slug: "veo3-fast-text-to-video",       label: "Veo 3 Fast",                     category: "Veo",      priceHint: "$$" },

    // ── Kuaishou Kling ──
    { slug: "kling-v3.0-pro-text-to-video",     label: "👑 Kling 3.0 Pro",            category: "Kling",    priceHint: "$$$$" },
    { slug: "kling-v3.0-standard-text-to-video",label: "Kling 3.0 Standard",          category: "Kling",    priceHint: "$$$" },
    { slug: "kling-v2.6-pro-t2v",               label: "Kling 2.6 Pro",               category: "Kling",    priceHint: "$$$" },
    { slug: "kling-v2.5-turbo-pro-t2v",         label: "⚡ Kling 2.5 Turbo Pro",      category: "Kling",    priceHint: "$$" },
    { slug: "kling-o1-text-to-video",           label: "Kling O1",                    category: "Kling",    priceHint: "$$$" },

    // ── xAI Grok ──
    { slug: "grok-imagine-text-to-video",       label: "🚀 Grok Imagine (xAI)",       category: "Grok",     priceHint: "$$$" },

    // ── OpenAI Sora ──
    { slug: "openai-sora-2-pro-text-to-video",  label: "👑 Sora 2 Pro",               category: "Sora",     priceHint: "$$$$" },
    { slug: "openai-sora-2-text-to-video",      label: "Sora 2",                      category: "Sora",     priceHint: "$$$" },

    // ── Runway ──
    { slug: "runway-text-to-video",             label: "Runway Gen-4",                category: "Runway",   priceHint: "$$$" },

    // ── MiniMax Hailuo ──
    { slug: "minimax-hailuo-2.3-pro-t2v",       label: "Hailuo 2.3 Pro",              category: "Hailuo",   priceHint: "$$" },

    // ── Alibaba Wan ──
    { slug: "wan2.7-text-to-video",             label: "Wan 2.7 (último)",            category: "Wan",      priceHint: "$$" },

    // ── ByteDance Seedance ──
    { slug: "seedance-v1.5-pro-t2v",            label: "Seedance 1.5 Pro",            category: "Seedance", priceHint: "$$" },

    // ── Tencent Hunyuan ──
    { slug: "hunyuan-text-to-video",            label: "Hunyuan",                     category: "Hunyuan",  priceHint: "$$" },

    // ── PixVerse ──
    { slug: "pixverse-v6-t2v",                  label: "PixVerse v6",                 category: "PixVerse", priceHint: "$$" },

    // ── LTX (Lightricks) ──
    { slug: "ltx-2-pro-text-to-video",          label: "LTX-2 Pro",                   category: "LTX",      priceHint: "$$" },
  ],
} as const;

export type MuapiImageModel = (typeof MUAPI_MODELS.image)[number]["slug"];
export type MuapiVideoModel = (typeof MUAPI_MODELS.video)[number]["slug"];

export { MuapiError };
