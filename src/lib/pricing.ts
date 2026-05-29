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
  // Imagen
  "flux-schnell-image":       1,
  "flux-dev-image":           2,
  "flux-kontext-dev-t2i":     2,
  "hidream_i1_fast_image":    1,
  "hidream_i1_dev_image":     2,
  "hidream_i1_full_image":    3,
  // Video
  "veo3-fast-text-to-video":  10,
  "veo3-text-to-video":       18,
  "runway-text-to-video":     15,
  "veo3-fast-image-to-video": 10,
  "veo3-image-to-video":      18,
  "runway-image-to-video":    15,
};

export function getCost(model: string): number {
  return MODEL_COSTS[model] ?? 1;
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
