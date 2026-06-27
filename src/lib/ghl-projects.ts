import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Conexiones GHL multi-proyecto. Cada proyecto = una cuenta/sub-cuenta GHL
 * independiente con su propio token privado + locationId.
 * Persistencia: archivo JSON privado en Supabase Storage (bucket `app-config`),
 * solo lo lee el servidor (service_role). El cliente nunca ve los tokens.
 * La conexión de las env vars (GHL_API_TOKEN/GHL_LOCATION_ID) aparece como
 * proyecto "env" para no romper la configuración existente.
 */
const BUCKET = "app-config";
const FILE = "ghl-projects.json";

export interface GhlProject { id: string; name: string; locationId: string; token: string; userId?: string | null }
export interface GhlProjectSafe { id: string; name: string; locationId: string; hasToken: boolean; isEnv?: boolean }
export interface GhlConn { token: string; locationId: string; userId?: string | null }

export function envConn(): GhlConn | null {
  const token = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) return null;
  return { token, locationId, userId: process.env.GHL_USER_ID || null };
}

async function readRaw(): Promise<GhlProject[]> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage.from(BUCKET).download(FILE);
    if (error || !data) return [];
    const parsed = JSON.parse(await data.text());
    return Array.isArray(parsed) ? (parsed as GhlProject[]) : [];
  } catch { return []; }
}

async function writeRaw(list: GhlProject[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.storage.from(BUCKET).upload(FILE, JSON.stringify(list, null, 2), { upsert: true, contentType: "application/json" });
    return { ok: !error, error: error?.message };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "error" }; }
}

/** Lista para el cliente (sin tokens). Incluye la conexión env si existe. */
export async function listGhlProjectsSafe(): Promise<GhlProjectSafe[]> {
  const out: GhlProjectSafe[] = [];
  const env = envConn();
  if (env) out.push({ id: "env", name: "Principal (env)", locationId: env.locationId, hasToken: true, isEnv: true });
  for (const p of await readRaw()) out.push({ id: p.id, name: p.name, locationId: p.locationId, hasToken: !!p.token });
  return out;
}

/** Devuelve la conexión (con token) de un proyecto. Cae a env si no se encuentra. */
export async function getGhlConn(id?: string | null): Promise<GhlConn | null> {
  if (!id || id === "env") return envConn();
  const p = (await readRaw()).find((x) => x.id === id);
  if (p?.token && p.locationId) return { token: p.token, locationId: p.locationId, userId: p.userId ?? null };
  return envConn();
}

export async function addGhlProject(input: { name: string; locationId: string; token: string; userId?: string }): Promise<{ ok: boolean; error?: string; id?: string }> {
  const name = (input.name || "").trim();
  const locationId = (input.locationId || "").trim();
  const token = (input.token || "").trim();
  if (!name || !locationId || !token) return { ok: false, error: "Faltan nombre, Location ID o token." };
  const list = await readRaw();
  if (list.some((x) => x.locationId === locationId)) return { ok: false, error: "Ya existe un proyecto con ese Location ID." };
  const id = `ghl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  list.push({ id, name, locationId, token, userId: (input.userId || "").trim() || null });
  const w = await writeRaw(list);
  return w.ok ? { ok: true, id } : { ok: false, error: w.error };
}

export async function removeGhlProject(id: string): Promise<{ ok: boolean; error?: string }> {
  if (id === "env") return { ok: false, error: "La conexión env se gestiona por variables de entorno." };
  return writeRaw((await readRaw()).filter((x) => x.id !== id));
}

export async function hasAnyGhl(): Promise<boolean> {
  if (envConn()) return true;
  return (await readRaw()).length > 0;
}
