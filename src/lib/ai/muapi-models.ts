/**
 * Catálogo de modelos Muapi — client-safe (sin secretos ni server-only).
 * Se separa de `muapi.ts` para que los componentes cliente (AIPlayground,
 * BatchGenerator) puedan importar MUAPI_MODELS sin arrastrar código server-only.
 */

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
