import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Sistema de afiliados.
 * - affiliates: code (slug), name, email, commission_rate (0..1)
 * - affiliate_sales: una venta atribuida (idempotente por session_id de Stripe)
 */

export interface Affiliate {
  code: string;
  name: string | null;
  email: string | null;
  commission_rate: number;
  clicks: number;
  created_at: string | null;
}

/** Registra una venta atribuida a un afiliado. Idempotente: no duplica por session_id. */
export async function recordAffiliateSale(params: {
  sessionId: string;
  code: string;
  amount: number | null;
  productName?: string | null;
  email?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const { sessionId, code, amount, productName, email } = params;
  if (!sessionId || !code) return { ok: false, error: "faltan datos" };

  const admin = createSupabaseAdminClient();

  // Buscar el afiliado para la tasa de comisión
  const { data: aff } = await admin
    .from("affiliates")
    .select("code,commission_rate")
    .eq("code", code)
    .maybeSingle();
  if (!aff) return { ok: false, error: "afiliado no existe" };

  const rate = typeof aff.commission_rate === "number" ? aff.commission_rate : 0.4;
  const commission = amount != null ? Math.round(amount * rate * 100) / 100 : null;

  // Insertar (ignora si ya existe esa session_id → idempotente)
  const { error } = await admin
    .from("affiliate_sales")
    .upsert(
      {
        session_id: sessionId,
        affiliate_code: code,
        product_name: productName ?? null,
        amount,
        commission,
        email: email ?? null,
      },
      { onConflict: "session_id", ignoreDuplicates: true }
    );

  return { ok: !error, error: error?.message };
}

/** Suma un clic a un enlace de afiliado (best-effort). */
export async function trackAffiliateClick(code: string): Promise<void> {
  if (!code) return;
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("affiliates").select("clicks").eq("code", code).maybeSingle();
  if (data) await admin.from("affiliates").update({ clicks: (data.clicks ?? 0) + 1 }).eq("code", code);
}

/** Lista afiliados con su resumen de ventas y comisiones. */
export async function listAffiliatesWithStats() {
  const admin = createSupabaseAdminClient();
  const { data: affiliates } = await admin.from("affiliates").select("*").order("created_at", { ascending: false });
  const { data: sales } = await admin.from("affiliate_sales").select("affiliate_code,amount,commission");

  const byCode: Record<string, { sales: number; revenue: number; commission: number }> = {};
  for (const s of sales ?? []) {
    const c = s.affiliate_code as string;
    if (!byCode[c]) byCode[c] = { sales: 0, revenue: 0, commission: 0 };
    byCode[c].sales += 1;
    byCode[c].revenue += Number(s.amount ?? 0);
    byCode[c].commission += Number(s.commission ?? 0);
  }

  return (affiliates ?? []).map((a: Record<string, unknown>) => ({
    ...a,
    stats: byCode[a.code as string] ?? { sales: 0, revenue: 0, commission: 0 },
  }));
}
