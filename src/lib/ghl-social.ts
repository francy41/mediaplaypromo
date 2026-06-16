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
    const accData = await accRes.json();
    const accounts: { id: string; platform?: string }[] = accData?.accounts ?? accData?.results ?? [];
    const wanted = p.platforms.map((s) => s.toLowerCase());
    const accountIds = accounts
      .filter((a) => wanted.length === 0 || (a.platform && wanted.includes(a.platform.toLowerCase())))
      .map((a) => a.id);
    if (accountIds.length === 0) return { ok: false, error: "Sin cuentas conectadas para esas plataformas" };

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
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.message ?? "Error creando post en GHL" };
    return { ok: true, postId: data?.id ?? data?.post?.id ?? data?._id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}
