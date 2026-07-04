import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Plantillas de captions guardadas por el usuario, aisladas por `ownerId`.
 * Cada admin (o el SuperAdmin) guarda las suyas. Se suman a las plantillas
 * por defecto que trae la app.
 * Persistencia: JSON privado en Supabase Storage (bucket `app-config`).
 */
const BUCKET = "app-config";
const FILE = "caption-templates.json";

export interface CaptionTemplate { id: string; label: string; text: string }
type Store = Record<string, CaptionTemplate[]>;

async function readAll(): Promise<Store> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage.from(BUCKET).download(FILE);
    if (error || !data) return {};
    const parsed = JSON.parse(await data.text());
    return (parsed && typeof parsed === "object") ? (parsed as Store) : {};
  } catch { return {}; }
}

async function writeAll(store: Store): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.storage.from(BUCKET).upload(FILE, JSON.stringify(store, null, 2), { upsert: true, contentType: "application/json" });
    return { ok: !error, error: error?.message };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : "error" }; }
}

export async function listTemplates(ownerId: string): Promise<CaptionTemplate[]> {
  return (await readAll())[ownerId] ?? [];
}

export async function addTemplate(ownerId: string, input: { label: string; text: string }): Promise<{ ok: boolean; error?: string; template?: CaptionTemplate }> {
  const label = (input.label || "").trim();
  const text = (input.text || "").trim();
  if (!label) return { ok: false, error: "Falta el nombre de la plantilla." };
  if (!text) return { ok: false, error: "La plantilla está vacía." };
  const store = await readAll();
  const list = store[ownerId] ?? [];
  const template: CaptionTemplate = { id: `tpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, label, text };
  list.push(template);
  store[ownerId] = list;
  const w = await writeAll(store);
  return w.ok ? { ok: true, template } : { ok: false, error: w.error };
}

export async function removeTemplate(ownerId: string, id: string): Promise<{ ok: boolean; error?: string }> {
  const store = await readAll();
  store[ownerId] = (store[ownerId] ?? []).filter((t) => t.id !== id);
  return writeAll(store);
}
