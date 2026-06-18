import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { getProductBySlug } from "@/lib/products";
import { getOrCreateLicenseForSession } from "@/lib/license";
import { recordAffiliateSale } from "@/lib/affiliate";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/checkout/session?session_id=cs_xxx
 * Verifica que la sesión esté pagada y devuelve el acceso (link de descarga)
 * del producto comprado. Usado por la página de "pago completado".
 */
export async function GET(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Pasarela no configurada" }, { status: 503 });
  }
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Falta session_id" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid" || session.status === "complete";
    const productSlug = session.metadata?.productSlug;
    const product = productSlug ? getProductBySlug(productSlug) : undefined;
    const email = session.customer_details?.email ?? session.customer_email ?? null;

    // Genera (o recupera) la clave de licencia solo si el pago está confirmado
    let licenseKey: string | null = null;
    if (paid) {
      const lic = await getOrCreateLicenseForSession({
        sessionId: session.id,
        productSlug,
        productName: session.metadata?.productName ?? product?.name ?? null,
        tierId: session.metadata?.tierId ?? null,
        email,
      });
      licenseKey = lic?.key ?? null;

      // Atribuir la venta a un afiliado si vino con ?ref (idempotente por session_id)
      const ref = session.metadata?.ref;
      if (ref) {
        await recordAffiliateSale({
          sessionId: session.id,
          code: ref,
          amount: typeof session.amount_total === "number" ? session.amount_total / 100 : null,
          productName: session.metadata?.productName ?? product?.name ?? null,
          email,
        });
      }
    }

    return NextResponse.json({
      paid,
      productName: session.metadata?.productName ?? product?.name ?? null,
      tierName: session.metadata?.tierName ?? null,
      email,
      // Importe para el evento de conversión (Meta Pixel Purchase)
      amountTotal: typeof session.amount_total === "number" ? session.amount_total / 100 : null,
      currency: (session.currency ?? "eur").toUpperCase(),
      // Solo entregamos el acceso si el pago está confirmado
      downloadUrl: paid ? (product?.downloadUrl ?? null) : null,
      licenseKey,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo verificar la sesión" },
      { status: 500 }
    );
  }
}
