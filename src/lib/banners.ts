"use client";
import { useEffect, useState } from "react";

export interface Banner {
  id: string;
  enabled: boolean;
  order: number;
  badge: string;
  title: string;
  accent: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  gradientFrom: string; // tailwind color e.g. "cyan-500"
  gradientTo: string;   // e.g. "blue-600"
}

// Pre-built class strings (avoids Tailwind JIT dynamic-class issue)
export const GRADIENT_CLASS: Record<string, { text: string; bg: string; orb: string; btn: string; border: string }> = {
  "cyan-400|blue-500":     { text: "from-cyan-400 to-blue-500",     bg: "from-cyan-500/15 via-blue-700/10 to-transparent",     orb: "bg-cyan-500/20",     btn: "from-cyan-500 to-blue-600",     border: "border-cyan-500/30" },
  "pink-500|rose-600":     { text: "from-pink-400 to-rose-500",     bg: "from-pink-500/15 via-rose-700/10 to-transparent",     orb: "bg-pink-500/25",     btn: "from-pink-500 to-rose-600",     border: "border-pink-500/30" },
  "violet-500|purple-600": { text: "from-violet-400 to-purple-500", bg: "from-violet-500/15 via-purple-700/10 to-transparent", orb: "bg-violet-500/25",   btn: "from-violet-500 to-purple-600", border: "border-violet-500/30" },
  "yellow-400|orange-500": { text: "from-yellow-400 to-orange-500", bg: "from-yellow-500/15 via-orange-700/10 to-transparent", orb: "bg-yellow-500/25",   btn: "from-yellow-500 to-orange-600", border: "border-yellow-500/30" },
  "green-400|emerald-500": { text: "from-green-400 to-emerald-500", bg: "from-green-500/15 via-emerald-700/10 to-transparent", orb: "bg-green-500/25",    btn: "from-green-500 to-emerald-600", border: "border-green-500/30" },
  "fuchsia-400|purple-600":{ text: "from-fuchsia-400 to-purple-500",bg: "from-fuchsia-500/15 via-purple-700/10 to-transparent",orb: "bg-fuchsia-500/25",  btn: "from-fuchsia-500 to-purple-600",border: "border-fuchsia-500/30" },
  "red-500|rose-600":      { text: "from-red-400 to-rose-500",      bg: "from-red-500/15 via-rose-700/10 to-transparent",      orb: "bg-red-500/25",      btn: "from-red-500 to-rose-600",      border: "border-red-500/30" },
  "slate-400|gray-600":    { text: "from-slate-300 to-gray-400",    bg: "from-slate-500/15 via-gray-700/10 to-transparent",    orb: "bg-slate-500/25",    btn: "from-slate-500 to-gray-600",    border: "border-slate-500/30" },
};

export function gradientFor(b: Banner) {
  return GRADIENT_CLASS[`${b.gradientFrom}|${b.gradientTo}`] ?? GRADIENT_CLASS["cyan-400|blue-500"];
}

const STORAGE_KEY = "mpp_banners_v1";

export const DEFAULT_BANNERS: Banner[] = [
  {
    id: "b1",
    enabled: true,
    order: 1,
    badge: "🎬 GENERADOR DE VIDEO IA",
    title: "CREA VIDEOS",
    accent: "EN SEGUNDOS.",
    subtitle: "Texto a video, imagen a video, avatares IA y plantillas premium. El estudio cinematográfico que cabe en tu navegador.",
    ctaLabel: "EMPEZAR AHORA",
    ctaHref: "/categories/generador-video",
    secondaryLabel: "VER DEMO",
    secondaryHref: "/categories/generador-video",
    gradientFrom: "pink-500",
    gradientTo: "rose-600",
  },
  {
    id: "b2",
    enabled: true,
    order: 2,
    badge: "✂️ EDITOR DE VIDEO PRO",
    title: "EDICIÓN PROFESIONAL",
    accent: "CON IA.",
    subtitle: "Timeline drag & drop, 500+ transiciones, corrección de color y exportación multi-plataforma. Estilo YF Auto Clip.",
    ctaLabel: "ABRIR EDITOR",
    ctaHref: "/categories/editor-video",
    secondaryLabel: "TUTORIAL",
    secondaryHref: "/categories/editor-video",
    gradientFrom: "violet-500",
    gradientTo: "purple-600",
  },
  {
    id: "b3",
    enabled: true,
    order: 3,
    badge: "⚡ AUTOMATIZACIONES IA",
    title: "TU EQUIPO INVISIBLE",
    accent: "TRABAJA POR TI.",
    subtitle: "Workflows visuales, WhatsApp Bot, CRM automation, email sequences. La IA hace el trabajo aburrido.",
    ctaLabel: "AUTOMATIZAR",
    ctaHref: "/categories/automatizaciones",
    secondaryLabel: "VER FLUJOS",
    secondaryHref: "/categories/automatizaciones",
    gradientFrom: "yellow-400",
    gradientTo: "orange-500",
  },
  {
    id: "b4",
    enabled: true,
    order: 4,
    badge: "🎙️ GENERADOR DE VOZ IA",
    title: "VOCES ULTRA-REALISTAS",
    accent: "EN 30+ IDIOMAS.",
    subtitle: "Clonación de voz en 10 segundos, locución emocional y exportación HD. Tu propio estudio de doblaje IA.",
    ctaLabel: "CLONAR VOZ",
    ctaHref: "/categories/generador-voz",
    secondaryLabel: "ESCUCHAR DEMO",
    secondaryHref: "/categories/generador-voz",
    gradientFrom: "cyan-400",
    gradientTo: "blue-500",
  },
  {
    id: "b5",
    enabled: true,
    order: 5,
    badge: "🎨 GENERADOR DE IMAGEN IA",
    title: "ARTE IA",
    accent: "SIN LÍMITES.",
    subtitle: "DALL-E 3 + Stable Diffusion + Upscale 4K + remoción de fondo. Genera 50 imágenes en un click.",
    ctaLabel: "GENERAR ARTE",
    ctaHref: "/categories/generador-imagen",
    secondaryLabel: "VER GALERÍA",
    secondaryHref: "/categories/generador-imagen",
    gradientFrom: "green-400",
    gradientTo: "emerald-500",
  },
  {
    id: "b6",
    enabled: true,
    order: 6,
    badge: "🏷️ MARCA BLANCA SAAS",
    title: "TU PROPIA",
    accent: "PLATAFORMA SAAS.",
    subtitle: "Vende nuestras herramientas bajo TU marca, en TU dominio, con TU branding. Modelo de negocio enterprise.",
    ctaLabel: "CONFIGURAR MARCA",
    ctaHref: "/categories/marca-blanca",
    secondaryLabel: "VER PLANES",
    secondaryHref: "/categories/marca-blanca",
    gradientFrom: "fuchsia-400",
    gradientTo: "purple-600",
  },
];

export function loadBanners(): Banner[] {
  if (typeof window === "undefined") return DEFAULT_BANNERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BANNERS;
    const parsed = JSON.parse(raw) as Banner[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_BANNERS;
    return parsed;
  } catch {
    return DEFAULT_BANNERS;
  }
}

export function saveBanners(banners: Banner[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
  window.dispatchEvent(new CustomEvent("banners:updated"));
}

export function resetBanners() {
  saveBanners(DEFAULT_BANNERS);
}

export function useBanners(): [Banner[], (b: Banner[]) => void] {
  const [banners, setBanners] = useState<Banner[]>(DEFAULT_BANNERS);

  useEffect(() => {
    setBanners(loadBanners());
    const handler = () => setBanners(loadBanners());
    window.addEventListener("banners:updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("banners:updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const update = (next: Banner[]) => {
    setBanners(next);
    saveBanners(next);
  };

  return [banners, update];
}

// Tailwind gradient palette options (for the editor)
export const GRADIENT_OPTIONS = [
  { from: "cyan-400", to: "blue-500", label: "Cyan → Azul" },
  { from: "pink-500", to: "rose-600", label: "Pink → Rose" },
  { from: "violet-500", to: "purple-600", label: "Violeta → Púrpura" },
  { from: "yellow-400", to: "orange-500", label: "Amarillo → Naranja" },
  { from: "green-400", to: "emerald-500", label: "Verde → Esmeralda" },
  { from: "fuchsia-400", to: "purple-600", label: "Fucsia → Púrpura" },
  { from: "red-500", to: "rose-600", label: "Rojo → Rose" },
  { from: "slate-400", to: "gray-600", label: "Slate → Gris" },
];
