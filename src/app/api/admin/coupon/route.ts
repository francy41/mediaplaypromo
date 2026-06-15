import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";

/**
 * POST /api/admin/coupon   Header: x-admin-secret == LICENSE_ADMIN_SECRET
 * Crea (idempotente) un cupón + código promocional en Stripe.
 * Body: { code?: "YFAUTOCLIP", percent?: 20 }
 * El checkout ya tiene allow_promotion_codes, así que el cliente lo introduce al pagar.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  if (!secret || req.headers.get("x-admin-secret") !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const code: string = (body.code || "YFAUTOCLIP").toUpperCase();
  const percent: number = Number(body.percent) || 20;

  try {
    const existing = await stripe.promotionCodes.list({ code, limit: 1 });
    if (existing.data.length > 0) {
      return NextResponse.json({ ok: true, alreadyExists: true, code, percent });
    }
    const coupon = await stripe.coupons.create({
      percent_off: percent,
      duration: "once",
      name: `${percent}% OFF - ${code}`,
    });
    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      active: true,
    } as unknown as Stripe.PromotionCodeCreateParams);
    return NextResponse.json({ ok: true, code: promo.code, percent, couponId: coupon.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
