import "server-only";
import type { GhlConn } from "@/lib/ghl-projects";

const API = "https://services.leadconnectorhq.com";

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
  return { Authorization: `Bearer ${token}`, Version: "2021-07-28", "Content-Type": "application/json" };
}

/**
 * Resuelve los accountIds de GHL que coinciden con las plataformas pedidas para
 * la conexión dada. Hace UNA sola llamada: úsalo una vez por lote, no por post.
 */
export async function resolveAccountIds(
  platforms: string[],
  conn: GhlConn,
): Promise<{ ok: boolean; accountIds: string[]; groups: string[][]; connected: string[]; error?: string }> {
  const acc = await getGHLAccounts(conn);
  if (!acc.ok) return { ok: false, accountIds: [], groups: [], connected: [], error: acc.error };
  const accounts = acc.accounts ?? [];
  if (accounts.length === 0) {
    return { ok: false, accountIds: [], groups: [], connected: [], error: "Este proyecto GHL no tiene redes conectadas. Conéctalas en su Social Planner." };
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
  const isTikTok = (plat?: string) => { const p = String(plat ?? "").toLowerCase(); return p.includes("tiktok") || p === "tt"; };
  const tiktokIds = matched.filter((a) => isTikTok(a.platform)).map((a) => a.id).filter(Boolean);
  const otherIds = matched.filter((a) => !isTikTok(a.platform)).map((a) => a.id).filter(Boolean);
  const groups = [otherIds, tiktokIds].filter((g) => g.length > 0);
  return { ok: true, accountIds, groups, connected };
}

const userIdCache = new Map<string, string>();

/** Resuelve el userId de GHL (obligatorio al crear posts) para la conexión dada. */
export async function resolveGHLUserId(conn: GhlConn): Promise<{ ok: boolean; userId?: string; error?: string }> {
  if (conn.userId) return { ok: true, userId: conn.userId };
  const cached = userIdCache.get(conn.locationId);
  if (cached) return { ok: true, userId: cached };
  try {
    const res = await fetch(`${API}/users/?locationId=${conn.locationId}`, { headers: ghlHeaders(conn.token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const m = (data && (data.message || data.error)) || `HTTP ${res.status}`;
      return { ok: false, error: `GHL users (${res.status}): ${typeof m === "string" ? m : JSON.stringify(m)}. Define el User ID del proyecto.` };
    }
    const users: unknown[] = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []);
    const first = (users[0] ?? {}) as Record<string, unknown>;
    const id = first.id ?? first._id;
    if (!id) return { ok: false, error: "GHL no devolvió usuarios. Define el User ID del proyecto." };
    userIdCache.set(conn.locationId, String(id));
    return { ok: true, userId: String(id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

/** Publica en GHL usando accountIds ya resueltos (no vuelve a pedir cuentas). */
export async function postToGHL(
  accountIds: string[],
  p: GHLPostParams,
  conn: GhlConn,
): Promise<{ ok: boolean; postId?: string; error?: string }> {
  if (!accountIds || accountIds.length === 0) return { ok: false, error: "Sin cuentas destino" };
  const u = await resolveGHLUserId(conn);
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
    const res = await fetch(`${API}/social-media-posting/${conn.locationId}/posts`, {
      method: "POST", headers: ghlHeaders(conn.token), body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const m = (data && (data.message || data.error));
      const detail = typeof m === "string" ? m : JSON.stringify(data).slice(0, 300);
      return { ok: false, error: `GHL post (${res.status}): ${detail || "sin detalle"}` };
    }
    return { ok: true, postId: data?.id ?? data?.post?.id ?? data?._id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

/** Crea un post programado (resuelve cuentas + publica) para la conexión dada. */
export async function createGHLSocialPost(p: GHLPostParams, conn: GhlConn): Promise<{ ok: boolean; postId?: string; error?: string }> {
  const r = await resolveAccountIds(p.platforms ?? [], conn);
  if (!r.ok) return { ok: false, error: r.error };
  return postToGHL(r.accountIds, p, conn);
}

/** Diagnóstico: cuentas sociales conectadas en GHL para la conexión dada. */
export async function getGHLAccounts(conn: GhlConn): Promise<{ ok: boolean; accounts?: { id: string; platform?: string }[]; error?: string; raw?: unknown }> {
  try {
    const res = await fetch(`${API}/social-media-posting/${conn.locationId}/accounts`, { headers: ghlHeaders(conn.token) });
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
    d.accounts, d.results, d.data,
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
