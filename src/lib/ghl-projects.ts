import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { listAdmins } from "@/lib/planner-admins";

/**
 * Conexiones GHL multi-proyecto. Cada proyecto = una cuenta/sub-cuenta GHL
 * independiente con su propio token privado + locationId.
 * Persistencia: archivo JSON privado en Supabase Storage (bucket `app-config`),
 * solo lo lee el servidor (service_role). El cliente nunca ve los tokens.
 * La conexión de las env vars (GHL_API_TOKEN/GHL_LOCATION_ID) aparece como
 * proyecto "env" para no romper la configuración existente.
 *
 * AISLAMIENTO POR ADMIN: cada proyecto tiene un `ownerId`. El SuperAdmin
 * (ownerId "super") ve la conexión env + sus proyectos; cada admin ve solo
 * los suyos. Los proyectos antiguos sin ownerId se consideran del "super".
 */
const BUCKET = "app-config";
const FILE = "ghl-projects.json";

export interface GhlProject { id: string; name: string; locationId: string; token: string; userId?: string | null; ownerId?: string }
export interface GhlProjectSafe { id: string; name: string; locationId: string; hasToken: boolean; isEnv?: boolean; ownerId?: string }
export interface GhlConn { token: string; locationId: string; userId?: string | null }

/** El propietario efectivo de un proyecto (legacy sin ownerId → "super"). */
function ownerOf(p: GhlProject): string {
  return p.ownerId ?? "super";
}

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

/**
 * Lista para el cliente (sin tokens).
 *  - admin: solo SUS proyectos.
 *  - super: TODAS las cuentas (env + las suyas + las de cada admin), cada una
 *    etiquetada con el nombre del admin dueño para poder distinguirlas.
 */
export async function listGhlProjectsSafe(ownerId: string): Promise<GhlProjectSafe[]> {
  const list = await readRaw();

  if (ownerId === "super") {
    const out: GhlProjectSafe[] = [];
    const env = envConn();
    if (env) out.push({ id: "env", name: "Principal · Mediaplaypromo", locationId: env.locationId, hasToken: true, isEnv: true });
    // owner → nombre del admin, para etiquetar las cuentas ajenas
    const admins = await listAdmins().catch(() => []);
    const nameOf = new Map(admins.map((a) => [a.id, a.name || a.username || "admin"]));
    for (const p of list) {
      const owner = ownerOf(p);
      const label = owner === "super" ? p.name : `${p.name} · ${nameOf.get(owner) ?? "admin"}`;
      out.push({ id: p.id, name: label, locationId: p.locationId, hasToken: !!p.token, ownerId: owner });
    }
    return out;
  }

  const out: GhlProjectSafe[] = [];
  for (const p of list) {
    if (ownerOf(p) === ownerId) out.push({ id: p.id, name: p.name, locationId: p.locationId, hasToken: !!p.token });
  }
  return out;
}

/** Dueño (ownerId) de un proyecto por su id. `env` es del super. */
export async function getProjectOwner(id: string | null | undefined): Promise<string | null> {
  if (!id || id === "env") return "super";
  const p = (await readRaw()).find((x) => x.id === id);
  return p ? ownerOf(p) : null;
}

/**
 * Devuelve la conexión (con token) de un proyecto.
 *  - admin: solo sus proyectos.
 *  - super: puede usar CUALQUIER proyecto (el suyo o el de un admin), o env.
 */
export async function getGhlConn(id: string | null | undefined, ownerId: string): Promise<GhlConn | null> {
  if (!id || id === "env") return ownerId === "super" ? envConn() : null;
  const list = await readRaw();
  const p = ownerId === "super"
    ? list.find((x) => x.id === id)                          // super accede a todo
    : list.find((x) => x.id === id && ownerOf(x) === ownerId);
  if (p?.token && p.locationId) return { token: p.token, locationId: p.locationId, userId: p.userId ?? null };
  // Solo el SuperAdmin cae a la conexión env por defecto.
  return ownerId === "super" ? envConn() : null;
}

export async function addGhlProject(input: { name: string; locationId: string; token: string; userId?: string; ownerId: string }): Promise<{ ok: boolean; error?: string; id?: string }> {
  const name = (input.name || "").trim();
  const locationId = (input.locationId || "").trim();
  const token = (input.token || "").trim();
  const ownerId = input.ownerId;
  if (!name || !locationId || !token) return { ok: false, error: "Faltan nombre, Location ID o token." };
  const list = await readRaw();
  if (list.some((x) => x.locationId === locationId && ownerOf(x) === ownerId)) return { ok: false, error: "Ya tienes un proyecto con ese Location ID." };
  const id = `ghl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  list.push({ id, name, locationId, token, userId: (input.userId || "").trim() || null, ownerId });
  const w = await writeRaw(list);
  return w.ok ? { ok: true, id } : { ok: false, error: w.error };
}

export async function removeGhlProject(id: string, ownerId: string): Promise<{ ok: boolean; error?: string }> {
  if (id === "env") return { ok: false, error: "La conexión env se gestiona por variables de entorno." };
  const list = await readRaw();
  const p = list.find((x) => x.id === id);
  if (!p) return { ok: false, error: "Proyecto no encontrado." };
  if (ownerOf(p) !== ownerId) return { ok: false, error: "No autorizado." };
  return writeRaw(list.filter((x) => x.id !== id));
}

export async function hasAnyGhl(ownerId: string): Promise<boolean> {
  if (ownerId === "super" && envConn()) return true;
  return (await readRaw()).some((p) => ownerOf(p) === ownerId);
}
