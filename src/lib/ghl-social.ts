import "server-only";

const API = "https://services.leadconnectorhq.com";

/** ¿Está configurada la API de GHL Social Planner? (token + location) */
export const GHL_SOCIAL_ENABLED = !!(process.env.GHL_API_TOKEN && process.env.GHL_LOCATION_ID);

interface GHLPostParams {
  caption: string;
  mediaUrl: string;
  scheduleDate: string; // ISO
  platforms: string[];  // ["instagram","facebook","youtube","tiktok","linkedin"]
}

/** Deriva el tipo MIME del video a partir de la extensión de la URL. GHL lo necesita. */
function mediaTypeFromUrl(url: string): string {
  const clean = (url.split("?")[0] || "").toLowerCase();
  if (clean.endsWith(".mov")) return "video/quicktime";
  if (clean.endsWith(".webm")) return "video/webm";
  if (clean.endsWith(".avi")) return "video/x-msvideo";
  if (clean.endsWith(".mkv")) return "video/x-matroska";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".png")) return "image/png";
  return "video/mp4";
}

function ghlHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };
}

/**
 * Resuelve los accountIds de GHL que coinciden con las plataformas pedidas.
 * Hace UNA sola llamada a la API: úsalo una vez por lote, no por publicación.
 */
export async function resolveAccountIds(
  platforms: string[]
): Promise<{ ok: boolean; accountIds: string[]; groups: string[][]; connected: string[]; error?: string }> {
  const acc = await getGHLAccounts();
  if (!acc.ok) return { ok: false, accountIds: [], groups: [], connected: [], error: acc.error };
  const accounts = acc.accounts ?? [];
  if (accounts.length === 0) {
    return { ok: false, accountIds: [], groups: [], connected: [], error: "GHL no tiene cuentas conectadas. Conecta tus redes en Social Planner." };
  }
  const connected = accounts.map((a) => a.platform || "?");
  const wanted = (platforms ?? []).map((s) => String(s ?? "").toLowerCase()).filter(Boolean);
  const matched = accounts.filter((a) => {
    const plat = String(a.platform ?? "").toLowerCase();
    return wanted.length === 0 || (plat !== "" && wanted.some((w) => plat.includes(w) || w.includes(plat)));
  });
  const accountIds = matched.map((a) => a.id).filter(Boolean);
  if (accountIds.length === 0) {
    return { ok: false, accountIds: [], groups: [], connected, error: `Ninguna red conectada coincide con [${wanted.join(", ")}]. Conectadas: ${connected.join(", ")}` };
  }

  // TikTok no acepta ir mezclado con otras plataformas en el mismo post de GHL.
  // Lo separamos en su propio grupo; el resto va junto.
  const isTikTok = (plat?: string) => {
    const p = String(plat ?? "").toLowerCase();
    return p.includes("tiktok") || p === "tt";
  };
  const tiktokIds = matched.filter((a) => isTikTok(a.platform)).map((a) => a.id).filter(Boolean);
  const otherIds = matched.filter((a) => !isTikTok(a.platform)).map((a) => a.id).filter(Boolean);
  const groups = [otherIds, tiktokIds].filter((g) => g.length > 0);

  return { ok: true, accountIds, groups, connected };
}

let cachedUserId: string | null = null;

/** Resuelve el userId de GHL (obligatorio al crear posts). Usa GHL_USER_ID o lo busca por API. */
export async function resolveGHLUserId(): Promise<{ ok: boolean; userId?: string; error?: string }> {
  if (process.env.GHL_USER_ID) return { ok: true, userId: process.env.GHL_USER_ID };
  if (cachedUserId) return { ok: true, userId: cachedUserId };
  const token = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) return { ok: false, error: "GHL no configurado" };
  try {
    const res = await fetch(`${API}/users/?locationId=${locationId}`, { headers: ghlHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const m = (data && (data.message || data.error)) || `HTTP ${res.status}`;
      return { ok: false, error: `GHL users (${res.status}): ${typeof m === "string" ? m : JSON.stringify(m)}. Define GHL_USER_ID en Vercel.` };
    }
    const users: unknown[] = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []);
    const first = (users[0] ?? {}) as Record<string, unknown>;
    const id = first.id ?? first._id;
    if (!id) return { ok: false, error: "GHL no devolvió usuarios. Define GHL_USER_ID en Vercel." };
    cachedUserId = String(id);
    return { ok: true, userId: cachedUserId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

/** Publica en GHL usando accountIds ya resueltos (no vuelve a pedir cuentas). */
export async function postToGHL(
  accountIds: string[],
  p: GHLPostParams
): Promise<{ ok: boolean; postId?: string; error?: string }> {
  const token = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) return { ok: false, error: "GHL no configurado" };
  if (!accountIds || accountIds.length === 0) return { ok: false, error: "Sin cuentas destino" };

  const u = await resolveGHLUserId();
  if (!u.ok || !u.userId) return { ok: false, error: u.error ?? "No se pudo resolver el userId de GHL" };

  try {
    const payload = {
      accountIds,
      summary: p.caption,
      media: [{ url: p.mediaUrl, type: mediaTypeFromUrl(p.mediaUrl) }],
      status: "scheduled",
      scheduleDate: p.scheduleDate,
      type: "post",
      userId: u.userId,
      tags: [] as string[],
    };
    const res = await fetch(`${API}/social-media-posting/${locationId}/posts`, {
      method: "POST",
      headers: ghlHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Mostramos el cuerpo crudo de GHL para poder diagnosticar qué campo le falta
      const m = (data && (data.message || data.error));
      const detail = typeof m === "string" ? m : JSON.stringify(data).slice(0, 300);
      return { ok: false, error: `GHL post (${res.status}): ${detail || "sin detalle"}` };
    }
    return { ok: true, postId: data?.id ?? data?.post?.id ?? data?._id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

/**
 * Crea un post PROGRAMADO en GoHighLevel Social Planner (resuelve cuentas + publica).
 * Para muchos posts a la vez usa resolveAccountIds + postToGHL para no saturar la API.
 */
export async function createGHLSocialPost(
  p: GHLPostParams
): Promise<{ ok: boolean; postId?: string; error?: string }> {
  const r = await resolveAccountIds(p.platforms ?? []);
  if (!r.ok) return { ok: false, error: r.error };
  return postToGHL(r.accountIds, p);
}

/** Diagnóstico: devuelve las cuentas sociales conectadas en GHL */
export async function getGHLAccounts(): Promise<{ ok: boolean; accounts?: { id: string; platform?: string }[]; error?: string; raw?: unknown }> {
  const token = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) return { ok: false, error: "GHL no configurado (falta token o location id)" };
  try {
    const res = await fetch(`${API}/social-media-posting/${locationId}/accounts`, {
      headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28", "Content-Type": "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const m = (data && (data.message || data.error)) || `HTTP ${res.status}`;
      return { ok: false, error: typeof m === "string" ? m : JSON.stringify(m), raw: data };
    }
    return { ok: true, accounts: listAccounts(data), raw: data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

/** Extrae el array de cuentas sea cual sea la forma de respuesta de GHL */
function listAccounts(accData: unknown): { id: string; platform?: string }[] {
  const d = accData as Record<string, unknown> | null;
  if (!d) return [];
  const candidates: unknown[] = [
    (d.results as Record<string, unknown> | undefined)?.accounts,
    d.accounts,
    d.results,
    d.data,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      return c.map((a) => {
        const o = (a ?? {}) as Record<string, unknown>;
        return {
          id: String(o.id ?? o._id ?? o.accountId ?? ""),
          platform: o.platform != null ? String(o.platform) : (o.type != null ? String(o.type) : undefined),
        };
      });
    }
  }
  return [];
}
