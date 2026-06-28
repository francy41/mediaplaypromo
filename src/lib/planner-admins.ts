import "server-only";
import { randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Administradores del Planificador.
 * El SuperAdmin (LICENSE_ADMIN_SECRET) crea admins; cada admin recibe un
 * CÓDIGO de acceso único (ADM-XXXX-XXXX) con el que entra GRATIS al
 * Planificador y conecta SUS PROPIAS cuentas GHL (aisladas por `ownerId`).
 *
 * Persistencia: archivo JSON privado en Supabase Storage (bucket `app-config`),
 * solo lo lee/escribe el servidor (service_role). El cliente nunca ve el archivo.
 */
const BUCKET = "app-config";
const FILE = "planner-admins.json";

export interface PlannerAdmin {
  id: string;
  name: string;
  email: string | null;
  code: string;
  active: boolean;
  createdAt: string;
}

/** Contexto del propietario resuelto a partir del secreto/código. */
export type OwnerCtx = { role: "super" | "admin"; ownerId: string; name: string };

/** Genera un código tipo ADM-XXXX-XXXX (sin caracteres ambiguos). */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += chars[bytes[i] % chars.length];
    if (i === 3) out += "-";
  }
  return `ADM-${out}`;
}

async function readRaw(): Promise<PlannerAdmin[]> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage.from(BUCKET).download(FILE);
    if (error || !data) return [];
    const parsed = JSON.parse(await data.text());
    return Array.isArray(parsed) ? (parsed as PlannerAdmin[]) : [];
  } catch { return []; }
}

async function writeRaw(list: PlannerAdmin[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.storage.from(BUCKET).upload(FILE, JSON.stringify(list, null, 2), { upsert: true, contentType: "application/json" });
    return { ok: !error, error: error?.message };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "error" }; }
}

/** Lista de admins (para el panel del SuperAdmin). Incluye el código. */
export async function listAdmins(): Promise<PlannerAdmin[]> {
  return (await readRaw()).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function createAdmin(input: { name: string; email?: string }): Promise<{ ok: boolean; error?: string; admin?: PlannerAdmin }> {
  const name = (input.name || "").trim();
  const email = (input.email || "").trim().toLowerCase() || null;
  if (!name) return { ok: false, error: "Falta el nombre del administrador." };
  const list = await readRaw();
  if (email && list.some((a) => a.email === email)) return { ok: false, error: "Ya existe un administrador con ese email." };
  // Código único garantizado
  let code = generateCode();
  while (list.some((a) => a.code === code)) code = generateCode();
  const admin: PlannerAdmin = {
    id: `adm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name, email, code, active: true, createdAt: new Date().toISOString(),
  };
  list.push(admin);
  const w = await writeRaw(list);
  return w.ok ? { ok: true, admin } : { ok: false, error: w.error };
}

export async function setAdminActive(id: string, active: boolean): Promise<{ ok: boolean; error?: string }> {
  const list = await readRaw();
  const a = list.find((x) => x.id === id);
  if (!a) return { ok: false, error: "Administrador no encontrado." };
  a.active = active;
  return writeRaw(list);
}

export async function removeAdmin(id: string): Promise<{ ok: boolean; error?: string }> {
  return writeRaw((await readRaw()).filter((x) => x.id !== id));
}

/**
 * Resuelve el secreto/código a un propietario.
 *  - LICENSE_ADMIN_SECRET            → SuperAdmin (ve su propio espacio "super")
 *  - código ADM-… de un admin activo → ese admin (ownerId = admin.id)
 *  - cualquier otra cosa             → null (401)
 */
export async function resolveOwner(secret: string | null | undefined): Promise<OwnerCtx | null> {
  const s = (secret || "").trim();
  if (!s) return null;
  const master = process.env.LICENSE_ADMIN_SECRET;
  if (master && s === master) return { role: "super", ownerId: "super", name: "SuperAdmin" };
  const a = (await readRaw()).find((x) => x.active && x.code === s);
  if (a) return { role: "admin", ownerId: a.id, name: a.name };
  return null;
}
