/**
 * Motor de sincronización del Canal en Directo.
 *
 * No es streaming real: es un canal "tipo TV" donde la posición de
 * reproducción se calcula a partir del RELOJ, así todos los espectadores
 * ven exactamente lo mismo al mismo tiempo (sin backend de vídeo).
 *
 * El bloque de programación se ancla al epoch Unix, por lo que es idéntico
 * en cualquier navegador/zona horaria. Con block=30min el bloque reinicia
 * en las marcas :00 y :30 (UTC) → "vuelve a repetir cada media hora".
 *
 * Módulo puro (sin dependencias de servidor) — se importa en cliente y test.
 */

export interface LiveItem {
  id: string;
  title: string;
  video_url: string;
  duration_seconds: number;
}

export interface NowPlaying {
  item: LiveItem;
  index: number;
  /** Segundo dentro del vídeo actual al que hay que hacer seek. */
  offset: number;
  /** Segundos que faltan para pasar al siguiente. */
  remaining: number;
  /** El vídeo que sonará a continuación (con bucle). */
  next: LiveItem;
}

/** Segundos transcurridos dentro del bloque actual, anclado al epoch. */
export function secondsIntoBlock(nowMs: number, blockSeconds: number): number {
  if (blockSeconds <= 0) return 0;
  const s = nowMs / 1000;
  return ((s % blockSeconds) + blockSeconds) % blockSeconds;
}

/**
 * Dado el estado de la lista y la hora actual, calcula qué vídeo debe
 * reproducirse y en qué segundo. Devuelve null si no hay contenido reproducible.
 */
export function computeNowPlaying(
  items: LiveItem[],
  blockSeconds: number,
  nowMs: number = Date.now()
): NowPlaying | null {
  const playable = items.filter((i) => i.duration_seconds > 0);
  if (playable.length === 0) return null;

  const total = playable.reduce((sum, i) => sum + i.duration_seconds, 0);
  if (total <= 0) return null;

  // Posición dentro del bloque, y dentro de la lista (que se repite en bucle
  // hasta llenar el bloque). Al cambiar de media hora, sib vuelve a ~0.
  const sib = secondsIntoBlock(nowMs, blockSeconds);
  let t = sib % total;

  for (let index = 0; index < playable.length; index++) {
    const item = playable[index];
    if (t < item.duration_seconds) {
      return {
        item,
        index,
        offset: t,
        remaining: item.duration_seconds - t,
        next: playable[(index + 1) % playable.length],
      };
    }
    t -= item.duration_seconds;
  }

  // Salvaguarda por errores de redondeo: devuelve el último.
  const last = playable[playable.length - 1];
  return { item: last, index: playable.length - 1, offset: 0, remaining: last.duration_seconds, next: playable[0] };
}
