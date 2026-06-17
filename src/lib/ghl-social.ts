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

/**
 * Crea un post PROGRAMADO en GoHighLevel Social Planner.
 * GHL publica en la fecha indicada. No rompe si no está configurado.
 */
export async function createGHLSocialPost(
  p: GHLPostParams
): Promise<{ ok: boolean; postId?: string; error?: string }> {
  const token = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) return { ok: false, error: "GHL no configurado" };

  const headers = {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };

  try {
    // 1) cuentas sociales conectadas en GHL
    const accRes = await fetch(`${API}/social-media-posting/${locationId}/accounts`, { headers });
    const accData = await accRes.json().catch(() => ({}));
    if (!accRes.ok) {
      const m = (accData && (accData.message || accData.error)) || `HTTP ${accRes.status}`;
      return { ok: false, error: `GHL cuentas: ${typeof m === "string" ? m : JSON.stringify(m)}` };
    }
    const accounts = listAccounts(accData);
    if (accounts.length === 0) {
      return { ok: false, error: "GHL no devolvió cuentas conectadas. Conecta tus redes en Social Planner." };
    }

    const wanted = (p.platforms ?? []).map((s) => String(s ?? "").toLowerCase()).filter(Boolean);
    const matched = accounts.filter((a) => {
      const plat = String(a.platform ?? "").toLowerCase();
      return wanted.length === 0 || (plat !== "" && wanted.some((w) => plat.includes(w) || w.includes(plat)));
    });
    const accountIds = matched.map((a) => a.id).filter(Boolean);

    if (accountIds.length === 0) {
      const have = accounts.map((a) => a.platform || "?").join(", ") || "ninguna";
      return { ok: false, error: `Ninguna cuenta conectada coincide con [${wanted.join(", ")}]. Conectadas: ${have}` };
    }

    // 2) crear el post programado
    const res = await fetch(`${API}/social-media-posting/${locationId}/posts`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        accountIds,
        summary: p.caption,
        media: [{ url: p.mediaUrl }],
        type: "post",
        scheduleDate: p.scheduleDate,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const m = (data && (data.message || data.error)) || `HTTP ${res.status}`;
      return { ok: false, error: `GHL post: ${typeof m === "string" ? m : JSON.stringify(m)}` };
    }
    return { ok: true, postId: data?.id ?? data?.post?.id ?? data?._id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
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
