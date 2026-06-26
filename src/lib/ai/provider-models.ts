/**
 * Proveedores de VIDEO disponibles en el generador + sus modelos.
 * Client-safe (sin secretos): alimenta el selector de proveedor del Playground.
 *
 * El backend (src/lib/ai/router.ts) usa `provider.id` para enrutar la generación
 * a la API correcta y `model.slug` como identificador del modelo en esa API.
 */
import { MUAPI_MODELS } from "@/lib/ai/muapi-models";

export interface ProviderModel {
  slug: string;
  label: string;
  category: string;
  priceHint: string;
}

export interface VideoProvider {
  id: string;        // = columna `provider` en api_integrations
  label: string;
  /** nota corta (ej. "Créditos gratis al registrarte") */
  note?: string;
  /** true = activo por defecto sin que el usuario conecte clave (usa env) */
  defaultReady?: boolean;
  models: ProviderModel[];
}

export const VIDEO_PROVIDERS: VideoProvider[] = [
  {
    id: "muapi",
    label: "MUAPI",
    note: "Activo · lo más barato Wan ~$0.03",
    defaultReady: true,
    // Reutiliza el catálogo Muapi (Veo, Kling, Sora, Wan…).
    models: MUAPI_MODELS.video.map((m) => ({ slug: m.slug, label: m.label, category: m.category, priceHint: m.priceHint })),
  },
  {
    id: "fal",
    label: "fal.ai",
    note: "Créditos gratis al registrarte · muy barato",
    models: [
      { slug: "fal-ai/ltx-video",                               label: "LTX Video (rápido)",   category: "Budget", priceHint: "$" },
      { slug: "fal-ai/wan-t2v",                                 label: "Wan T2V",              category: "Budget", priceHint: "$" },
      { slug: "fal-ai/minimax/video-01",                        label: "MiniMax Hailuo",       category: "Premium", priceHint: "$$" },
      { slug: "fal-ai/kling-video/v1/standard/text-to-video",   label: "Kling 1.0 Standard",   category: "Premium", priceHint: "$$" },
      { slug: "fal-ai/luma-dream-machine",                      label: "Luma Dream Machine",   category: "Premium", priceHint: "$$" },
      { slug: "fal-ai/hunyuan-video",                           label: "Hunyuan Video",        category: "Premium", priceHint: "$$" },
    ],
  },
  {
    id: "replicate",
    label: "Replicate",
    note: "Miles de modelos · pago por uso",
    models: [
      { slug: "wan-video/wan-2.2-t2v-fast", label: "Wan 2.2 Fast", category: "Budget", priceHint: "$" },
      { slug: "lightricks/ltx-video",       label: "LTX Video",    category: "Budget", priceHint: "$" },
      { slug: "minimax/video-01",           label: "MiniMax Hailuo", category: "Premium", priceHint: "$$" },
      { slug: "kwaivgi/kling-v1.6-standard", label: "Kling 1.6 Standard", category: "Premium", priceHint: "$$" },
    ],
  },
];

export function getVideoProvider(id: string): VideoProvider | undefined {
  return VIDEO_PROVIDERS.find((p) => p.id === id);
}

/* ── Proveedores de IMAGEN ── */
export const IMAGE_PROVIDERS: VideoProvider[] = [
  {
    id: "muapi",
    label: "MUAPI",
    note: "Premium · Flux, HiDream, Grok…",
    defaultReady: true,
    models: MUAPI_MODELS.image.map((m) => ({ slug: m.slug, label: m.label, category: m.category, priceHint: m.priceHint })),
  },
  {
    id: "nvidia",
    label: "NVIDIA",
    note: "Gratis con tus créditos de NVIDIA",
    models: [
      { slug: "black-forest-labs/flux.1-schnell", label: "⚡ FLUX.1 Schnell (gratis)", category: "FLUX", priceHint: "Gratis" },
      { slug: "black-forest-labs/flux.1-dev",     label: "FLUX.1 Dev (gratis)",        category: "FLUX", priceHint: "Gratis" },
    ],
  },
];

/** Proveedores disponibles para un tipo de generación. */
export function providersFor(kind: "image" | "video"): VideoProvider[] {
  return kind === "video" ? VIDEO_PROVIDERS : IMAGE_PROVIDERS;
}
