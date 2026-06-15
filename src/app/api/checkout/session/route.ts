import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { getProductBySlug } from "@/lib/products";

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

    return NextResponse.json({
      paid,
      productName: session.metadata?.productName ?? product?.name ?? null,
      tierName: session.metadata?.tierName ?? null,
      email: session.customer_details?.email ?? null,
      // Solo entregamos el enlace si el pago está confirmado
      downloadUrl: paid ? (product?.downloadUrl ?? null) : null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo verificar la sesión" },
      { status: 500 }
    );
  }
}
