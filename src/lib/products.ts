/**
 * 🛍️ Sistema de productos digitales
 * Productos a la venta dentro de cada categoría (software, plantillas, cursos, packs).
 *
 * Cada producto tiene 6 paquetes de precios típicos.
 * Cuando Stripe esté conectado, los `id` de price tier se mapean a Stripe Price IDs.
 */

import type { LucideIcon } from "lucide-react";
import {
  Music, Scissors, Replace, Clock, Rocket, Star, Hand, Shield,
  Zap, Sparkles, Crown, Users, FileVideo, Layers, Award, Repeat
} from "lucide-react";

export interface PriceTier {
  id: string;
  name: string;
  description: string;
  /** Precio en EUR */
  price: number;
  /** Precio original tachado (para mostrar descuento) */
  originalPrice?: number;
  /** Plan destacado */
  popular?: boolean;
  /** Best deal — mejor opción */
  bestDeal?: boolean;
  features: string[];
  cta: string;
  /** Stripe price id (mock por ahora) */
  stripePriceId?: string;
}

export interface SubProduct {
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  borderColor: string;
  bgColor: string;
  features: string[];
}

export interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface Product {
  id: string;
  slug: string;
  /** Categoría a la que pertenece (matches CATEGORIES.slug) */
  categorySlug: string;
  name: string;
  shortName?: string;
  tagline: string;
  description: string;
  /** Texto largo para hero */
  longDescription?: string;
  /** Tagline para box / paquete (ej: "PROCESAMIENTO MASIVO DE VIDEO") */
  packTagline?: string;
  /** Autor / brand */
  author?: string;
  /** Gradient principal */
  gradient: string;
  borderColor: string;
  textAccent: string;
  /** Sub-productos (si es bundle) */
  subProducts?: SubProduct[];
  /** Beneficios principales */
  benefits: Benefit[];
  /** 6 paquetes de precio */
  prices: PriceTier[];
  /** Stats sociales */
  stats?: { label: string; value: string }[];
  /** Premium product */
  premium?: boolean;
  /** Mostrar en marketplace público */
  enabled: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   📦 PRODUCTO: YF AUTO CLIP
   Categoría: editor-video
   ═══════════════════════════════════════════════════════════════ */

const YF_AUTO_CLIP: Product = {
  id: "yf-auto-clip",
  slug: "yf-auto-clip",
  categorySlug: "editor-video",
  name: "YF AUTO CLIP",
  shortName: "YF Auto Clip",
  tagline: "Suite profesional de edición de video",
  description: "Procesamiento masivo de video. Reemplaza audios, corta clips y convierte formatos con calidad profesional.",
  longDescription: "Todo lo que necesitas para automatizar, editar y destacar tu contenido como un verdadero profesional. 3 herramientas en una sola suite — sin instalaciones complicadas, sin curvas de aprendizaje.",
  packTagline: "PROCESAMIENTO MASIVO DE VIDEO",
  author: "by YANKYFILMS",
  gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
  borderColor: "border-violet-500/40",
  textAccent: "text-violet-400",
  premium: true,
  enabled: true,

  // 3 sub-productos del pack
  subProducts: [
    {
      name: "AUDIO REPLACE",
      description: "Reemplaza el audio original de tus videos de forma masiva y automática.",
      icon: Music,
      color: "from-cyan-400 to-blue-600",
      borderColor: "border-cyan-500/30",
      bgColor: "from-cyan-500/10 to-blue-500/5",
      features: [
        "Reemplazo masivo de audio",
        "Sincronización automática",
        "Soporte MP4, MOV, MKV, AVI",
        "Control de volumen y fade",
        "Ideal para YouTube, Reels, TikTok",
      ],
    },
    {
      name: "CLIP CUTTER",
      description: "Corta, divide y personaliza tus videos con precisión total al segundo.",
      icon: Scissors,
      color: "from-pink-500 to-red-600",
      borderColor: "border-pink-500/30",
      bgColor: "from-pink-500/10 to-red-500/5",
      features: [
        "Cortes precisos al segundo",
        "Divide videos largos en partes",
        "Sin re-encoding (más rápido)",
        "Vista previa instantánea",
        "Exportación en alta calidad",
      ],
    },
    {
      name: "FORMAT CONVERTER",
      description: "Convierte tus videos a múltiples formatos listos para cualquier plataforma.",
      icon: Replace,
      color: "from-violet-500 to-purple-700",
      borderColor: "border-violet-500/30",
      bgColor: "from-violet-500/10 to-purple-500/5",
      features: [
        "MP4, MOV, MKV, AVI, WEBM",
        "Optimizado para redes sociales",
        "Conversión por lotes (batch)",
        "Calidad profesional garantizada",
        "Soporte multiformato",
      ],
    },
  ],

  benefits: [
    { icon: Clock, title: "Ahorra Tiempo", description: "Procesa decenas de videos en minutos, no horas." },
    { icon: Rocket, title: "Aumenta Productividad", description: "Enfócate en crear, nosotros hacemos el trabajo pesado." },
    { icon: Award, title: "Resultados Profesionales", description: "Audio limpio, sincronizado y sin complicaciones." },
    { icon: Hand, title: "Fácil de Usar", description: "Interfaz intuitiva y procesos sencillos. Listo en 2 clicks." },
    { icon: Shield, title: "100% Seguro", description: "Procesamiento local. Tus archivos siempre están protegidos." },
    { icon: Repeat, title: "Actualizaciones de por vida", description: "Una compra, actualizaciones para siempre." },
  ],

  stats: [
    { label: "Creadores activos", value: "2,400+" },
    { label: "Videos procesados", value: "1.2M+" },
    { label: "Rating", value: "4.9/5" },
    { label: "Soporte", value: "24/7" },
  ],

  // ─── 6 paquetes de precios ───
  prices: [
    {
      id: "audio-replace-only",
      name: "Audio Replace",
      description: "Solo la herramienta de reemplazo de audio",
      price: 27,
      cta: "Comprar Audio Replace",
      features: [
        "1 herramienta: Audio Replace",
        "Licencia personal",
        "Actualizaciones 1 año",
        "Soporte por email",
        "1 PC autorizado",
      ],
      stripePriceId: "price_yfauto_audio_27",
    },
    {
      id: "clip-cutter-only",
      name: "Clip Cutter",
      description: "Solo la herramienta de corte de clips",
      price: 27,
      cta: "Comprar Clip Cutter",
      features: [
        "1 herramienta: Clip Cutter",
        "Licencia personal",
        "Actualizaciones 1 año",
        "Soporte por email",
        "1 PC autorizado",
      ],
      stripePriceId: "price_yfauto_cutter_27",
    },
    {
      id: "format-converter-only",
      name: "Format Converter",
      description: "Solo la herramienta de conversión",
      price: 27,
      cta: "Comprar Format Converter",
      features: [
        "1 herramienta: Format Converter",
        "Licencia personal",
        "Actualizaciones 1 año",
        "Soporte por email",
        "1 PC autorizado",
      ],
      stripePriceId: "price_yfauto_converter_27",
    },
    {
      id: "duo-pack",
      name: "Pack Duo",
      description: "Elige 2 de las 3 herramientas — ahorra €7",
      price: 47,
      originalPrice: 54,
      cta: "Comprar Pack Duo",
      features: [
        "2 herramientas a elegir",
        "Licencia personal",
        "Actualizaciones 1 año",
        "Soporte prioritario",
        "1 PC autorizado",
        "Ahorras €7 vs comprarlas por separado",
      ],
      stripePriceId: "price_yfauto_duo_47",
    },
    {
      id: "complete-pack",
      name: "Pack Completo",
      description: "Las 3 herramientas + Bonus",
      price: 67,
      originalPrice: 81,
      popular: true,
      bestDeal: true,
      cta: "Comprar Pack Completo",
      features: [
        "✨ Las 3 herramientas YF AUTO CLIP",
        "🎁 BONUS: 50 plantillas pro",
        "Licencia personal + comercial",
        "Actualizaciones DE POR VIDA",
        "Soporte prioritario 24/7",
        "2 PCs autorizados",
        "Acceso a comunidad VIP Discord",
      ],
      stripePriceId: "price_yfauto_complete_67",
    },
    {
      id: "agency-license",
      name: "Agency License",
      description: "Para agencias y revendedores",
      price: 197,
      cta: "Licencia Agencia",
      features: [
        "Las 3 herramientas YF AUTO CLIP",
        "💼 Licencia comercial completa",
        "♾️ PCs ilimitados",
        "Marca blanca (white-label)",
        "Reventa permitida",
        "Soporte dedicado",
        "Onboarding 1-on-1 incluido",
        "API access",
      ],
      stripePriceId: "price_yfauto_agency_197",
    },
  ],
};

/* ═══════════════════════════════════════════════════════════════
   CATÁLOGO GLOBAL DE PRODUCTOS
   ═══════════════════════════════════════════════════════════════ */

export const PRODUCTS: Product[] = [
  YF_AUTO_CLIP,
];

/** Productos visibles en una categoría específica */
export function productsByCategory(categorySlug: string): Product[] {
  return PRODUCTS.filter((p) => p.categorySlug === categorySlug && p.enabled);
}

/** Buscar producto por slug */
export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
