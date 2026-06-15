import "server-only";
import { randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/** Genera una clave tipo YF-XXXX-XXXX-XXXX-XXXX (sin caracteres ambiguos) */
function generateKey(prefix = "YF"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(16);
  let out = "";
  for (let i = 0; i < 16; i++) {
    out += chars[bytes[i] % chars.length];
    if (i % 4 === 3 && i < 15) out += "-";
  }
  return `${prefix}-${out}`;
}

interface SessionLicenseParams {
  sessionId: string;
  productSlug?: string | null;
  productName?: string | null;
  tierId?: string | null;
  email?: string | null;
}

/**
 * Crea (o devuelve si ya existe) la licencia de una sesión de Stripe pagada.
 * Idempotente por stripe_session_id. Devuelve null si Supabase no está disponible
 * (la entrega del producto no depende de esto).
 */
export async function getOrCreateLicenseForSession(
  p: SessionLicenseParams
): Promise<{ key: string; status: string } | null> {
  try {
    const admin = createSupabaseAdminClient();
    const { data: existing } = await admin
      .from("licenses")
      .select("license_key,status")
      .eq("stripe_session_id", p.sessionId)
      .maybeSingle();
    if (existing) return { key: existing.license_key, status: existing.status };

    const key = generateKey();
    const { error } = await admin.from("licenses").insert({
      license_key: key,
      product_slug: p.productSlug ?? null,
      product_name: p.productName ?? null,
      tier_id: p.tierId ?? null,
      email: p.email ? p.email.toLowerCase() : null,
      stripe_session_id: p.sessionId,
      status: "active",
    });
    if (error) {
      console.error("[license] insert error:", error.message);
      return null;
    }
    return { key, status: "active" };
  } catch (e) {
    console.error("[license] getOrCreate error:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Valida una clave (la usa el software al activarse). Cuenta la activación. */
export async function validateLicense(rawKey: string): Promise<{
  valid: boolean;
  reason?: string;
  product?: string | null;
  email?: string | null;
  activations?: number;
  maxActivations?: number;
}> {
  const key = rawKey.trim().toUpperCase();
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("licenses").select("*").eq("license_key", key).maybeSingle();
    if (!data) return { valid: false, reason: "not_found" };
    if (data.status !== "active") return { valid: false, reason: data.status };

    const activations = (data.activation_count ?? 0) + 1;
    await admin
      .from("licenses")
      .update({ activation_count: activations, last_validated_at: new Date().toISOString() })
      .eq("license_key", key);

    return {
      valid: true,
      product: data.product_slug ?? null,
      email: data.email ?? null,
      activations,
      maxActivations: data.max_activations ?? null,
    };
  } catch (e) {
    console.error("[license] validate error:", e instanceof Error ? e.message : e);
    return { valid: false, reason: "service_unavailable" };
  }
}

/** Revoca una clave (en reembolso/contracargo). El software dejará de validarla. */
export async function revokeLicense(rawKey: string): Promise<boolean> {
  return setLicenseStatus(rawKey, "revoked");
}

export interface LicenseRow {
  id: string;
  license_key: string;
  product_name: string | null;
  product_slug: string | null;
  tier_id: string | null;
  email: string | null;
  status: string;
  activation_count: number | null;
  max_activations: number | null;
  created_at: string | null;
  last_validated_at: string | null;
  stripe_session_id: string | null;
}

/** Lista las licencias (para el panel admin). */
export async function listLicenses(limit = 300): Promise<LicenseRow[]> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("licenses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("[license] list error:", error.message);
      return [];
    }
    return (data ?? []) as LicenseRow[];
  } catch (e) {
    console.error("[license] list error:", e instanceof Error ? e.message : e);
    return [];
  }
}

/** Cambia el estado de una clave (active | revoked). */
export async function setLicenseStatus(rawKey: string, status: "active" | "revoked"): Promise<boolean> {
  const key = rawKey.trim().toUpperCase();
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("licenses").update({ status }).eq("license_key", key);
    return !error;
  } catch {
    return false;
  }
}
