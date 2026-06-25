import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Gestor de integraciones / claves de API.
 * Las claves se guardan en la tabla `api_integrations` (RLS: solo service_role).
 * `getIntegration` lee de la BD y, si no hay, cae al env (MUAPI sigue funcionando).
 */
export interface Integration {
  provider: string;
  apiKey: string | null;
  baseUrl: string | null;
  enabled: boolean;
}

// Fallback a variables de entorno para proveedores ya configurados allí.
const ENV_FALLBACK: Record<string, { key?: string; base?: string }> = {
  muapi: { key: process.env.MUAPI_API_KEY, base: process.env.MUAPI_BASE_URL },
  nvidia: { key: process.env.NVIDIA_API_KEY, base: process.env.NVIDIA_BASE_URL },
};

/** Devuelve la integración activa de un proveedor (BD → env fallback). null si no hay clave. */
export async function getIntegration(provider: string): Promise<Integration | null> {
  const p = provider.trim().toLowerCase();

  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("api_integrations")
      .select("provider,api_key,base_url,enabled")
      .eq("provider", p)
      .maybeSingle();
    if (data && data.enabled && data.api_key) {
      return { provider: p, apiKey: data.api_key, baseUrl: data.base_url ?? null, enabled: true };
    }
  } catch {
    // La tabla puede no existir todavía → seguimos con el fallback de env.
  }

  const env = ENV_FALLBACK[p];
  if (env?.key) return { provider: p, apiKey: env.key, baseUrl: env.base ?? null, enabled: true };
  return null;
}
