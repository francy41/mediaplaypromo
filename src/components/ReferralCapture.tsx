"use client";
import { useEffect } from "react";

/**
 * Captura el parámetro ?ref=CODIGO de cualquier enlace de afiliado y lo guarda
 * 30 días (cookie + localStorage). En el checkout se adjunta a la venta.
 */
export function ReferralCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = (params.get("ref") || "").trim().toLowerCase();
      if (!ref) return;

      // Guardar 30 días
      const maxAge = 60 * 60 * 24 * 30;
      document.cookie = `mpp_ref=${encodeURIComponent(ref)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      try { localStorage.setItem("mpp_ref", ref); } catch {}

      // Contar el clic (best-effort, no bloquea)
      fetch(`/api/affiliate/click?ref=${encodeURIComponent(ref)}`, { method: "POST" }).catch(() => {});
    } catch {
      /* noop */
    }
  }, []);

  return null;
}

/** Lee el código de afiliado guardado (cookie o localStorage). */
export function getStoredRef(): string | null {
  try {
    const m = document.cookie.match(/(?:^|;\s*)mpp_ref=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
    return localStorage.getItem("mpp_ref");
  } catch {
    return null;
  }
}
