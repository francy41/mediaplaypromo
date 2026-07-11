import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Acceso de servidor al Canal en Directo usando la SERVICE ROLE key
 * (ignora RLS). Se usa desde las rutas /api/live/* protegidas por
 * x-admin-secret == LICENSE_ADMIN_SECRET.
 */

export const LIVE_BUCKET = "live-videos";

let _svc: SupabaseClient | null = null;
export function liveServiceClient(): SupabaseClient {
  if (_svc) return _svc;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  _svc = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _svc;
}

/** Verifica el secreto de administrador de la petición. */
export function isAdmin(req: Request): boolean {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

export interface LiveConfig {
  title: string;
  block_minutes: number;
  enabled: boolean;
}

export interface LiveItemRow {
  id: string;
  title: string;
  video_url: string;
  storage_path: string | null;
  duration_seconds: number;
  position: number;
  enabled: boolean;
  created_at: string;
}

const DEFAULT_CONFIG: LiveConfig = { title: "Canal en Directo", block_minutes: 30, enabled: true };

export async function getConfig(): Promise<LiveConfig> {
  const db = liveServiceClient();
  const { data } = await db
    .from("live_channel_config")
    .select("title, block_minutes, enabled")
    .eq("id", 1)
    .maybeSingle();
  return data ?? DEFAULT_CONFIG;
}

export async function updateConfig(patch: Partial<LiveConfig>): Promise<LiveConfig> {
  const db = liveServiceClient();
  const { data, error } = await db
    .from("live_channel_config")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("title, block_minutes, enabled")
    .single();
  if (error) throw error;
  return data;
}

/** Lista de items ordenada. `onlyEnabled` para el reproductor público. */
export async function listItems(onlyEnabled = false): Promise<LiveItemRow[]> {
  const db = liveServiceClient();
  let q = db.from("live_channel_items").select("*").order("position", { ascending: true });
  if (onlyEnabled) q = q.eq("enabled", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as LiveItemRow[];
}

export async function addItem(input: {
  title: string;
  video_url: string;
  storage_path?: string | null;
  duration_seconds: number;
}): Promise<LiveItemRow> {
  const db = liveServiceClient();
  // Coloca el nuevo item al final.
  const { data: last } = await db
    .from("live_channel_items")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;

  const { data, error } = await db
    .from("live_channel_items")
    .insert({
      title: input.title || "Sin título",
      video_url: input.video_url,
      storage_path: input.storage_path ?? null,
      duration_seconds: input.duration_seconds,
      position,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as LiveItemRow;
}

export async function deleteItem(id: string): Promise<void> {
  const db = liveServiceClient();
  const { data: row } = await db
    .from("live_channel_items")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (row?.storage_path) {
    await db.storage.from(LIVE_BUCKET).remove([row.storage_path]).catch(() => {});
  }
  const { error } = await db.from("live_channel_items").delete().eq("id", id);
  if (error) throw error;
}

export async function setEnabled(id: string, enabled: boolean): Promise<void> {
  const db = liveServiceClient();
  const { error } = await db.from("live_channel_items").update({ enabled }).eq("id", id);
  if (error) throw error;
}

/** Reordena según el array de ids recibido (index → position). */
export async function reorder(ids: string[]): Promise<void> {
  const db = liveServiceClient();
  await Promise.all(
    ids.map((id, i) => db.from("live_channel_items").update({ position: i }).eq("id", id))
  );
}
