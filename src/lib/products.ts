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
  /** Precio total del paquete en EUR */
  price: number;
  /** Precio original tachado (para mostrar descuento) */
  originalPrice?: number;
  /** Periodo de facturación */
  billingPeriod: "monthly" | "6months" | "yearly" | "lifetime";
  /** Precio mensual equivalente (para comparativa visual) */
  monthlyEquivalent?: number;
  /** Etiqueta del periodo (ej: "/mes", "/6 meses", "/año") */
  periodLabel: string;
  /** Plan destacado */
  popular?: boolean;
  /** Best deal — mejor opción */
  bestDeal?: boolean;
  /** Badge texto custom (ej: "MÁS POPULAR", "AHORRO 40%") */
  badge?: string;
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

  // ─── 3 planes de suscripción: Mensual / Semestral / Anual ───
  prices: [
    {
      id: "monthly",
      name: "Mensual",
      description: "Empieza ya — máxima flexibilidad",
      price: 27,
      billingPeriod: "monthly",
      monthlyEquivalent: 27,
      periodLabel: "/mes",
      cta: "Empezar Mensual",
      features: [
        "✨ Las 3 herramientas YF AUTO CLIP",
        "Audio Replace + Clip Cutter + Format Converter",
        "Actualizaciones incluidas",
        "Soporte por email <24h",
        "Cancela cuando quieras",
        "1 PC autorizado",
      ],
      stripePriceId: "price_yfauto_monthly_27",
    },
    {
      id: "6months",
      name: "Semestral",
      description: "Ahorra €35 vs mensual — pago 6 meses",
      price: 127,
      originalPrice: 162,
      billingPeriod: "6months",
      monthlyEquivalent: 21.17,
      periodLabel: "/6 meses",
      badge: "AHORRO 22%",
      cta: "Empezar Semestral",
      features: [
        "✨ Las 3 herramientas YF AUTO CLIP",
        "Actualizaciones incluidas",
        "Soporte prioritario <12h",
        "🎁 BONUS: 25 plantillas pro",
        "2 PCs autorizados",
        "Ahorras €35 vs plan mensual",
        "Equivale a €21.17/mes",
      ],
      stripePriceId: "price_yfauto_6months_127",
    },
    {
      id: "yearly",
      name: "Anual",
      description: "Mejor valor — ahorras €127/año",
      price: 197,
      originalPrice: 324,
      billingPeriod: "yearly",
      monthlyEquivalent: 16.42,
      periodLabel: "/año",
      popular: true,
      bestDeal: true,
      badge: "MÁS POPULAR · AHORRO 40%",
      cta: "Empezar Anual",
      features: [
        "✨ Las 3 herramientas YF AUTO CLIP",
        "Actualizaciones DE POR VIDA",
        "Soporte prioritario 24/7",
        "🎁 BONUS: 50 plantillas pro premium",
        "🎁 BONUS: Acceso comunidad VIP Discord",
        "3 PCs autorizados",
        "Ahorras €127 vs plan mensual",
        "Equivale a €16.42/mes",
        "💼 Uso comercial incluido",
      ],
      stripePriceId: "price_yfauto_yearly_197",
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
