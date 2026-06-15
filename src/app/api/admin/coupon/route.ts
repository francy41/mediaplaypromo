import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/coupon   Header: x-admin-secret == LICENSE_ADMIN_SECRET
 * Crea (idempotente) un cupón + código promocional en Stripe vía API REST directa.
 * Body: { code?: "YFAUTOCLIP", percent?: 20 }
 */
export async function POST(req: NextRequest) {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  if (!secret || req.headers.get("x-admin-secret") !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk) {
    return NextResponse.json({ error: "Falta STRIPE_SECRET_KEY" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const code: string = (body.code || "YFAUTOCLIP").toUpperCase();
  const percent: number = Number(body.percent) || 20;

  const authHeaders = {
    Authorization: `Bearer ${sk}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  try {
    // 1) ¿ya existe el código?
    const listRes = await fetch(
      `https://api.stripe.com/v1/promotion_codes?code=${encodeURIComponent(code)}&limit=1`,
      { headers: { Authorization: `Bearer ${sk}` } }
    );
    const listData = await listRes.json();
    if (Array.isArray(listData?.data) && listData.data.length > 0) {
      return NextResponse.json({ ok: true, alreadyExists: true, code, percent });
    }

    // 2) crear el cupón (% de descuento)
    const couponRes = await fetch("https://api.stripe.com/v1/coupons", {
      method: "POST",
      headers: authHeaders,
      body: new URLSearchParams({
        percent_off: String(percent),
        duration: "once",
        name: `${percent}% OFF - ${code}`,
      }),
    });
    const coupon = await couponRes.json();
    if (!couponRes.ok) {
      return NextResponse.json({ error: coupon?.error?.message ?? "Error creando cupón" }, { status: 500 });
    }

    // 3) crear el código promocional asociado
    const promoRes = await fetch("https://api.stripe.com/v1/promotion_codes", {
      method: "POST",
      headers: authHeaders,
      body: new URLSearchParams({ coupon: coupon.id, code, active: "true" }),
    });
    const promo = await promoRes.json();
    if (!promoRes.ok) {
      return NextResponse.json({ error: promo?.error?.message ?? "Error creando código" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, code: promo.code, percent, couponId: coupon.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
