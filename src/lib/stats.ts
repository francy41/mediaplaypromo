"use client";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/categories";

/**
 * Contador de generaciones por categoría.
 * Persistente en localStorage + incrementa al lanzar batch/single en el playground.
 *
 * Cuando Supabase esté conectado, esto pasa a leer/escribir desde DB con realtime.
 */

const STORAGE_KEY = "mpp_gen_stats_v1";

/** Baseline "social proof" — número de generaciones falsas pero creíbles por categoría.
 *  Se calcula por orden de la categoría para que las más populares tengan más actividad. */
function baselineFor(slug: string): number {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return 0;
  // Más populares → 5k-15k, las más nuevas → 200-1500
  const base = Math.max(0, 18 - cat.order) * 800; // 14400 para la #1, 800 para la #17
  const noise = (slug.charCodeAt(0) * 137) % 1500; // ruido determinista
  return base + noise + 250;
}

interface Stats {
  byCategory: Record<string, number>; // increments solo (en sesión actual)
  total: number;
}

function loadIncrements(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

function saveIncrements(data: Record<string, number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("stats:updated"));
}

/** Incrementa contador de una categoría por N generaciones */
export function trackGeneration(categorySlug: string, count = 1) {
  if (typeof window === "undefined") return;
  const incs = loadIncrements();
  incs[categorySlug] = (incs[categorySlug] ?? 0) + count;
  saveIncrements(incs);
}

/** Devuelve el contador TOTAL (baseline + incremento user) para una categoría */
export function getCount(slug: string, increments?: Record<string, number>): number {
  const incs = increments ?? loadIncrements();
  return baselineFor(slug) + (incs[slug] ?? 0);
}

/** Formato visual: 14.4k, 1.2k, 856 */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/** Hook React para usar contadores en componentes (se actualiza en tiempo real) */
export function useStats(): Stats {
  const [incs, setIncs] = useState<Record<string, number>>({});

  useEffect(() => {
    setIncs(loadIncrements());
    const handler = () => setIncs(loadIncrements());
    window.addEventListener("stats:updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("stats:updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const byCategory: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    byCategory[cat.slug] = baselineFor(cat.slug) + (incs[cat.slug] ?? 0);
  }
  const total = Object.values(byCategory).reduce((s, n) => s + n, 0);

  return { byCategory, total };
}
