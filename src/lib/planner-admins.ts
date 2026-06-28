import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ADMIN_CREDENTIALS } from "@/lib/auth";

/**
 * Administradores del Planificador.
 * El SuperAdmin crea admins con USUARIO + CONTRASEÑA; cada admin entra GRATIS
 * al Planificador con sus credenciales y conecta SUS PROPIAS cuentas GHL
 * (aisladas por `ownerId`).
 *
 * Internamente cada admin tiene un `code` opaco que actúa de token de sesión
 * (lo que se manda en `x-admin-secret`). El admin nunca lo ve: hace login con
 * usuario+contraseña y el servidor le devuelve ese token.
 *
 * Persistencia: archivo JSON privado en Supabase Storage (bucket `app-config`),
 * solo lo lee/escribe el servidor (service_role). El cliente nunca lo ve.
 */
const BUCKET = "app-config";
const FILE = "planner-admins.json";

export interface PlannerAdmin {
  id: string;
  name: string;
  username: string;
  email: string | null;
  code: string;          // token interno de sesión
  passwordHash: string;
  active: boolean;
  createdAt: string;
}

/** Vista segura para el panel (sin hash ni token). */
export interface PlannerAdminSafe {
  id: string;
  name: string;
  username: string;
  email: string | null;
  active: boolean;
  createdAt: string;
}

/** Contexto del propietario resuelto a partir del token. */
export type OwnerCtx = { role: "super" | "admin"; ownerId: string; name: string };

function generateCode(): string {
  return `ADM-${randomBytes(12).toString("hex")}`;
}

function safe(a: PlannerAdmin): PlannerAdminSafe {
  return { id: a.id, name: a.name, username: a.username ?? "", email: a.email ?? null, active: a.active, createdAt: a.createdAt };
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

/** Lista de admins (vista segura) para el panel del SuperAdmin. */
export async function listAdmins(): Promise<PlannerAdminSafe[]> {
  return (await readRaw()).map(safe).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function createAdmin(input: { name?: string; username: string; password: string; email?: string }): Promise<{ ok: boolean; error?: string; admin?: PlannerAdminSafe }> {
  const username = (input.username || "").trim();
  const password = (input.password || "").trim();
  const name = (input.name || "").trim() || username;
  const email = (input.email || "").trim().toLowerCase() || null;
  if (!username) return { ok: false, error: "Falta el usuario." };
  if (password.length < 4) return { ok: false, error: "La contraseña debe tener al menos 4 caracteres." };
  const list = await readRaw();
  if (list.some((a) => (a.username || "").toLowerCase() === username.toLowerCase())) return { ok: false, error: "Ese usuario ya existe." };
  let code = generateCode();
  while (list.some((a) => a.code === code)) code = generateCode();
  const admin: PlannerAdmin = {
    id: `adm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name, username, email, code,
    passwordHash: await bcrypt.hash(password, 10),
    active: true, createdAt: new Date().toISOString(),
  };
  list.push(admin);
  const w = await writeRaw(list);
  return w.ok ? { ok: true, admin: safe(admin) } : { ok: false, error: w.error };
}

export async function setAdminPassword(id: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const pw = (password || "").trim();
  if (pw.length < 4) return { ok: false, error: "La contraseña debe tener al menos 4 caracteres." };
  const list = await readRaw();
  const a = list.find((x) => x.id === id);
  if (!a) return { ok: false, error: "Administrador no encontrado." };
  a.passwordHash = await bcrypt.hash(pw, 10);
  return writeRaw(list);
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
 * Login del Planificador. Devuelve el token de sesión que el cliente usará
 * como `x-admin-secret`.
 *  - usuario+contraseña de un admin activo → su token interno (code)
 *  - email+contraseña del SuperAdmin (los del dashboard) → LICENSE_ADMIN_SECRET
 */
export async function verifyCredentials(username: string, password: string): Promise<{ ok: boolean; token?: string; role?: "super" | "admin"; name?: string; error?: string }> {
  const u = (username || "").trim().toLowerCase();
  const pw = password || "";
  if (!u || !pw) return { ok: false, error: "Faltan usuario y contraseña." };

  const a = (await readRaw()).find((x) => x.active && (x.username || "").toLowerCase() === u);
  if (a && a.passwordHash && await bcrypt.compare(pw, a.passwordHash)) {
    return { ok: true, token: a.code, role: "admin", name: a.name };
  }

  // SuperAdmin: mismas credenciales que el dashboard
  if (u === ADMIN_CREDENTIALS.email.toLowerCase() && pw === ADMIN_CREDENTIALS.password) {
    const master = process.env.LICENSE_ADMIN_SECRET;
    if (master) return { ok: true, token: master, role: "super", name: ADMIN_CREDENTIALS.name };
  }

  return { ok: false, error: "Usuario o contraseña incorrectos." };
}

/**
 * Resuelve el token (x-admin-secret) a un propietario.
 *  - LICENSE_ADMIN_SECRET → SuperAdmin (ownerId "super")
 *  - token de un admin activo → ese admin (ownerId = admin.id)
 */
export async function resolveOwner(token: string | null | undefined): Promise<OwnerCtx | null> {
  const s = (token || "").trim();
  if (!s) return null;
  const master = process.env.LICENSE_ADMIN_SECRET;
  if (master && s === master) return { role: "super", ownerId: "super", name: "SuperAdmin" };
  const a = (await readRaw()).find((x) => x.active && x.code === s);
  if (a) return { role: "admin", ownerId: a.id, name: a.name };
  return null;
}
