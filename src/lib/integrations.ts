import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Gestor de integraciones / claves de API.
 * Persistencia: archivo JSON privado en Supabase Storage (bucket `app-config`,
 * no público → solo el servidor/service_role lo lee). No requiere tabla SQL.
 * `getIntegration` lee del archivo y, si no hay, cae al env (MUAPI sigue funcionando).
 */

const BUCKET = "app-config";
const FILE = "integrations.json";

export interface Integration {
  provider: string;
  apiKey: string | null;
  baseUrl: string | null;
  enabled: boolean;
}

export interface StoredIntegration {
  provider: string;
  label: string | null;
  api_key: string | null;
  base_url: string | null;
  enabled: boolean;
  updated_at: string;
}

// Fallback a variables de entorno para proveedores ya configurados allí.
const ENV_FALLBACK: Record<string, { key?: string; base?: string }> = {
  muapi: { key: process.env.MUAPI_API_KEY, base: process.env.MUAPI_BASE_URL },
  nvidia: { key: process.env.NVIDIA_API_KEY, base: process.env.NVIDIA_BASE_URL },
};

/** Lee todas las integraciones del archivo privado en Storage. */
export async function readAllIntegrations(): Promise<StoredIntegration[]> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage.from(BUCKET).download(FILE);
    if (error || !data) return [];
    const text = await data.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as StoredIntegration[]) : [];
  } catch {
    return [];
  }
}

/** Guarda todas las integraciones (sobrescribe el archivo). */
export async function writeAllIntegrations(list: StoredIntegration[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.storage.from(BUCKET).upload(FILE, JSON.stringify(list, null, 2), {
      upsert: true,
      contentType: "application/json",
    });
    return { ok: !error, error: error?.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

/** Devuelve la integración activa de un proveedor (Storage → env fallback). null si no hay clave. */
export async function getIntegration(provider: string): Promise<Integration | null> {
  const p = provider.trim().toLowerCase();

  const list = await readAllIntegrations();
  const found = list.find((i) => i.provider === p);
  if (found && found.enabled && found.api_key) {
    return { provider: p, apiKey: found.api_key, baseUrl: found.base_url ?? null, enabled: true };
  }

  const env = ENV_FALLBACK[p];
  if (env?.key) return { provider: p, apiKey: env.key, baseUrl: env.base ?? null, enabled: true };
  return null;
}
