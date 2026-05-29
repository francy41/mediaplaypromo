/**
 * Pricing & Credits — Single source of truth
 * Edita aquí los planes y precios — homepage, /pricing y playground los leen automáticamente.
 */

export interface PricingPlan {
  id: "free" | "starter" | "pro" | "business" | "enterprise";
  name: string;
  tagline: string;
  /** EUR/mes. null = custom */
  priceMonthly: number | null;
  /** EUR/año (con descuento). null = custom */
  priceYearly: number | null;
  /** Créditos al mes para gen AI */
  credits: number;
  /** Modelos accesibles */
  models: "basic" | "all" | "all+priority";
  /** Color gradient */
  gradient: string;
  /** Color de borde */
  borderColor: string;
  /** Color del texto accent */
  textAccent: string;
  /** Plan recomendado */
  popular?: boolean;
  /** Features incluidas */
  features: string[];
  /** Features NO incluidas (mostradas tachadas) */
  notIncluded?: string[];
  /** CTA */
  cta: string;
  /** Stripe price ID (mock por ahora) */
  stripePriceMonthly?: string;
  stripePriceYearly?: string;
}

export const PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Para probar la plataforma",
    priceMonthly: 0,
    priceYearly: 0,
    credits: 10,
    models: "basic",
    gradient: "from-slate-500 to-gray-600",
    borderColor: "border-white/10",
    textAccent: "text-white",
    features: [
      "10 créditos / mes (~5 imágenes)",
      "Solo modelos básicos (Flux Dev, Wan)",
      "Marca de agua en exports",
      "Comunidad Discord",
    ],
    notIncluded: ["Videos con IA", "Modelos premium", "Soporte prioritario"],
    cta: "Empezar gratis",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Para creadores serios",
    priceMonthly: 29,
    priceYearly: 290,
    credits: 500,
    models: "all",
    gradient: "from-cyan-500 to-blue-600",
    borderColor: "border-cyan-500/40",
    textAccent: "text-cyan-400",
    popular: true,
    features: [
      "500 créditos / mes (~250 imágenes o ~25 videos)",
      "TODOS los modelos (Sora 2, Veo 3, Imagen 4...)",
      "Sin marca de agua",
      "Resolución 4K disponible",
      "Soporte por email <24h",
      "Acceso anticipado a nuevos modelos",
    ],
    cta: "Empezar prueba 7 días",
    stripePriceMonthly: "price_pro_monthly_mock",
    stripePriceYearly: "price_pro_yearly_mock",
  },
  {
    id: "business",
    name: "Business",
    tagline: "Para agencias y equipos",
    priceMonthly: 99,
    priceYearly: 990,
    credits: 2500,
    models: "all+priority",
    gradient: "from-fuchsia-500 to-purple-600",
    borderColor: "border-fuchsia-500/40",
    textAccent: "text-fuchsia-400",
    features: [
      "2,500 créditos / mes (~1,250 imágenes o ~125 videos)",
      "Todos los modelos + cola prioritaria",
      "5 miembros del equipo",
      "Marca blanca (white-label)",
      "API access ilimitado",
      "Soporte dedicado",
      "SLA 99.9%",
    ],
    cta: "Empezar prueba 14 días",
    stripePriceMonthly: "price_business_monthly_mock",
    stripePriceYearly: "price_business_yearly_mock",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Volumen ilimitado",
    priceMonthly: null,
    priceYearly: null,
    credits: -1, // unlimited
    models: "all+priority",
    gradient: "from-yellow-400 to-orange-500",
    borderColor: "border-orange-500/40",
    textAccent: "text-orange-400",
    features: [
      "Créditos ilimitados",
      "Modelos custom finetuned",
      "Equipo ilimitado",
      "Multi-tenant (resellers)",
      "Dominio propio + SSL",
      "Account manager dedicado",
      "Contrato y facturación custom",
    ],
    cta: "Contactar ventas",
  },
];

/* ─────────────────────────────────────────────
   Costos por modelo (en créditos)
   ───────────────────────────────────────────── */

export const MODEL_COSTS: Record<string, number> = {
  // ── Imagen ──
  "flux-schnell-image":         1,
  "flux-dev-image":             2,
  "flux-kontext-dev-t2i":       2,
  "hidream_i1_fast_image":      1,
  "hidream_i1_dev_image":       2,
  "hidream_i1_full_image":      3,
  "grok-imagine-text-to-image": 4,
  "wan2.7-text-to-image-pro":   3,
  "hunyuan-image-3.0":          2,

  // ── Video Veo (Google) ──
  "veo3.1-text-to-video":       30,
  "veo3.1-fast-text-to-video":  15,
  "veo3.1-lite-text-to-video":   8,
  "veo3-text-to-video":         25,
  "veo3-fast-text-to-video":    12,

  // ── Video Kling ──
  "kling-v3.0-pro-text-to-video":      28,
  "kling-v3.0-standard-text-to-video": 18,
  "kling-v2.6-pro-t2v":                22,
  "kling-v2.5-turbo-pro-t2v":          14,
  "kling-o1-text-to-video":            20,

  // ── Video Grok (xAI) ──
  "grok-imagine-text-to-video": 20,

  // ── Video Sora (OpenAI) ──
  "openai-sora-2-pro-text-to-video": 35,
  "openai-sora-2-text-to-video":     25,

  // ── Video Runway ──
  "runway-text-to-video":  18,
  "runway-image-to-video": 15,

  // ── Video Hailuo ──
  "minimax-hailuo-2.3-pro-t2v": 14,
  "minimax-hailuo-2.3-fast":     6,

  // ── Video Wan ──
  "wan2.7-text-to-video":      10,
  "wan2.5-text-to-video-fast":  5,

  // ── Video Seedance ──
  "seedance-v1.5-pro-t2v":       12,
  "seedance-v1.5-pro-t2v-fast":   6,

  // ── Video Hunyuan ──
  "hunyuan-text-to-video":       10,
  "hunyuan-fast-text-to-video":   5,

  // ── Video PixVerse ──
  "pixverse-v6-t2v": 10,

  // ── Video LTX ──
  "ltx-2-pro-text-to-video":  10,
  "ltx-2-fast-text-to-video":  5,
};

export function getCost(model: string): number {
  return MODEL_COSTS[model] ?? 1;
}

/* ─────────────────────────────────────────────
   💰 ADMIN MARGIN — Ganancia del SuperAdmin
   ─────────────────────────────────────────────
   El admin (tú) gana 50% real sobre el coste de cada generación.

   Flujo:
   1. Muapi te factura el coste real (ej: $0.50 por video Veo3 Fast)
   2. Le cobras al usuario final: real_cost × (1 + ADMIN_MARGIN_PCT) = $0.75
   3. Tu ganancia = $0.25 (50% sobre el coste = 33% del precio final)

   Alternativa por suscripción:
   - Plan Pro €29/mes × 500 créditos = €0.058/crédito facturado
   - Coste medio Muapi ≈ €0.025-0.04/crédito
   - Margen efectivo = 40-65%
*/
export const ADMIN_MARGIN_PCT = 0.50;

/** Coste REAL de Muapi en USD (estimado por modelo). Verifica en muapi.ai/pricing */
export const MODEL_REAL_COST_USD: Record<string, number> = {
  // Imagen
  "flux-schnell-image":              0.003,
  "flux-dev-image":                  0.025,
  "flux-kontext-dev-t2i":            0.025,
  "hidream_i1_fast_image":           0.008,
  "hidream_i1_dev_image":            0.025,
  "hidream_i1_full_image":           0.05,
  "grok-imagine-text-to-image":      0.04,
  "wan2.7-text-to-image-pro":        0.03,
  "hunyuan-image-3.0":               0.02,
  // Video Veo
  "veo3.1-text-to-video":            3.00,
  "veo3.1-fast-text-to-video":       1.50,
  "veo3.1-lite-text-to-video":       0.80,
  "veo3-text-to-video":              2.50,
  "veo3-fast-text-to-video":         0.50,
  // Video Kling
  "kling-v3.0-pro-text-to-video":      2.80,
  "kling-v3.0-standard-text-to-video": 1.50,
  "kling-v2.6-pro-t2v":                2.00,
  "kling-v2.5-turbo-pro-t2v":          0.60,
  "kling-o1-text-to-video":            1.80,
  // Grok / Sora
  "grok-imagine-text-to-video":        1.20,
  "openai-sora-2-pro-text-to-video":   3.50,
  "openai-sora-2-text-to-video":       2.00,
  // Runway / Hailuo / Wan / Seedance / Hunyuan / PixVerse / LTX
  "runway-text-to-video":              1.50,
  "runway-image-to-video":             1.30,
  "minimax-hailuo-2.3-pro-t2v":        1.00,
  "minimax-hailuo-2.3-fast":           0.30,
  "wan2.7-text-to-video":              0.60,
  "wan2.5-text-to-video-fast":         0.25,
  "seedance-v1.5-pro-t2v":             0.80,
  "seedance-v1.5-pro-t2v-fast":        0.35,
  "seedance-v1.5-pro-video-extend":    0.80,
  "hunyuan-text-to-video":             0.60,
  "hunyuan-fast-text-to-video":        0.25,
  "pixverse-v6-t2v":                   0.60,
  "ltx-2-pro-text-to-video":           0.60,
  "ltx-2-fast-text-to-video":          0.25,
};

/** Devuelve el coste REAL en USD que Muapi te cobra */
export function getRealCostUSD(model: string): number {
  return MODEL_REAL_COST_USD[model] ?? 0.01;
}

/** Precio que cobras al cliente final (coste real + margen admin) */
export function getCustomerPriceUSD(model: string): number {
  return getRealCostUSD(model) * (1 + ADMIN_MARGIN_PCT);
}

/** Ganancia del admin por generación */
export function getAdminProfitUSD(model: string): number {
  return getRealCostUSD(model) * ADMIN_MARGIN_PCT;
}

/** Stats agregadas para SuperAdmin (a partir de N generaciones de un modelo) */
export function projectAdminEarnings(model: string, generations: number) {
  const realCost   = getRealCostUSD(model) * generations;
  const customerP  = getCustomerPriceUSD(model) * generations;
  const profit     = getAdminProfitUSD(model) * generations;
  return {
    generations,
    realCostUSD: +realCost.toFixed(4),
    customerPriceUSD: +customerP.toFixed(4),
    adminProfitUSD: +profit.toFixed(4),
    marginPct: ADMIN_MARGIN_PCT,
  };
}

/* ─────────────────────────────────────────────
   FAQs para la página de pricing
   ───────────────────────────────────────────── */

export const PRICING_FAQ = [
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí. Cancelas con un click desde tu panel. No hay permanencia ni penalización. Conservas el acceso hasta el final del período pagado.",
  },
  {
    q: "¿Qué pasa si me quedo sin créditos?",
    a: "Puedes comprar créditos extra a tarifa puntual o subir de plan. Los créditos del plan se renuevan cada mes el día de tu suscripción.",
  },
  {
    q: "¿Los créditos se acumulan?",
    a: "Los créditos del plan caducan al final de cada mes. Los créditos extra comprados por separado no caducan.",
  },
  {
    q: "¿Tengo que dar mi tarjeta para la prueba?",
    a: "No para el plan Free. Para la prueba de Pro y Business sí, pero no cobramos durante los 7-14 días. Cancelas antes y nada se cobra.",
  },
  {
    q: "¿Puedo usar las imágenes/videos comercialmente?",
    a: "Sí en planes Pro, Business y Enterprise (sin marca de agua, licencia comercial incluida). El plan Free es solo para uso personal.",
  },
  {
    q: "¿Cómo funciona la marca blanca (white-label)?",
    a: "Configuras tu dominio propio, logo, colores y vendes la plataforma bajo tu marca. Nosotros operamos la infraestructura, tú te quedas el revenue.",
  },
  {
    q: "¿Aceptan PayPal y crypto?",
    a: "Stripe (todas las tarjetas) y PayPal en todos los planes. Crypto (USDC) disponible en Enterprise.",
  },
];
