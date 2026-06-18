/**
 * Meta (Facebook) Pixel — utilidades.
 * Se activa SOLO si está definido NEXT_PUBLIC_META_PIXEL_ID.
 * El ID se obtiene en Meta Events Manager (es un número de ~15-16 dígitos).
 */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Dispara un evento estándar del Meta Pixel. No hace nada si el pixel no está activo. */
export function metaTrack(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  try {
    window.fbq("track", event, params ?? {});
  } catch {
    /* noop */
  }
}
