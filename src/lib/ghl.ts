import "server-only";

/**
 * Envía un evento a GoHighLevel (LeadConnector) vía Inbound Webhook.
 * Configura la URL del webhook en la env var GHL_WEBHOOK_URL.
 * Si no está configurada, no hace nada (no rompe el flujo).
 *
 * En GHL: Automation → Workflow → Trigger "Inbound Webhook" → copia la URL.
 * El workflow puede entonces: crear/actualizar contacto, enviar email de entrega,
 * añadir a un pipeline, y disparar publicaciones del Social Planner.
 */
export async function sendToGHL(event: string, data: Record<string, unknown>): Promise<boolean> {
  const url = process.env.GHL_WEBHOOK_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, source: "mediaplaypromo", timestamp: new Date().toISOString(), ...data }),
    });
    return res.ok;
  } catch (e) {
    console.error("[ghl] error:", e instanceof Error ? e.message : e);
    return false;
  }
}
