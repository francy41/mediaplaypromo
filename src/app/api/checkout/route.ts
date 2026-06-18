import { NextRequest, NextResponse } from "next/server";
import { getStripe, billingToRecurring } from "@/lib/stripe/server";
import { getProductBySlug } from "@/lib/products";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/checkout
 * Crea una sesión de Stripe Checkout para un producto + tier.
 *
 * Body: { productSlug, tierId, email?, origin, embedded? }
 * Devuelve:
 *   - embedded=true  → { clientSecret }  (pago dentro de la web, sin redirigir)
 *   - embedded=false → { url }           (redirige a Stripe Checkout)
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Pasarela de pago no configurada todavía. Falta STRIPE_SECRET_KEY." },
      { status: 503 }
    );
  }

  try {
    const { productSlug, tierId, email, origin, embedded, ref } = await req.json();
    const affiliateRef = typeof ref === "string" ? ref.trim().toLowerCase().slice(0, 60) : "";

    const product = getProductBySlug(productSlug);
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    const tier =
      product.prices.find((p) => p.id === tierId) ??
      (product.lifetimeOffer?.id === tierId ? product.lifetimeOffer : undefined);
    if (!tier) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const baseUrl = origin || process.env.NEXT_PUBLIC_SITE_URL || "https://mediaplaypromo.com";
    const recurring = billingToRecurring(tier.billingPeriod);
    const isSubscription = !!recurring;

    // Precio en céntimos (EUR)
    const unitAmount = Math.round(tier.price * 100);

    // Parámetros comunes a ambos modos
    const baseParams = {
      mode: isSubscription ? "subscription" as const : "payment" as const,
      customer_email: email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: unitAmount,
            recurring,
            product_data: {
              name: `${product.name}${product.version ? " " + product.version : ""} · ${tier.name}`,
              description: tier.description,
            },
          },
        },
      ],
      // Metadata para reconciliar en el webhook
      metadata: {
        productSlug,
        tierId,
        productName: product.name,
        tierName: tier.name,
        ...(affiliateRef ? { ref: affiliateRef } : {}),
      },
      ...(isSubscription
        ? { subscription_data: { metadata: { productSlug, tierId } } }
        : {}),
      allow_promotion_codes: true,
      // Aviso legal: producto digital de descarga inmediata (base para denegar reembolsos abusivos)
      custom_text: {
        submit: {
          message:
            "Producto digital de descarga inmediata. Al completar el pago aceptas recibir el acceso al instante y reconoces que, una vez descargado, no aplican reembolsos (renuncia al derecho de desistimiento).",
        },
      },
    };

    // Checkout con REDIRECCIÓN (página hospedada de Stripe).
    // Es el método más estable y a prueba de cambios de API; evita el modo
    // embebido (ui_mode) que Stripe ha ido renombrando y rompe el modal.
    void embedded; // ignorado a propósito: siempre usamos redirección
    const session = await stripe.checkout.sessions.create({
      ...baseParams,
      billing_address_collection: "auto",
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/categories/${product.categorySlug}/${product.slug}?canceled=1`,
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (e) {
    // Distinguimos el tipo de error de Stripe para diagnóstico claro
    const err = e as { type?: string; message?: string; code?: string };
    const type = err?.type ?? "";
    let msg = err?.message ?? "Error creando checkout";
    if (type === "StripeConnectionError") {
      msg = "No se pudo conectar con Stripe (red). Inténtalo de nuevo en unos segundos.";
    } else if (type === "StripeAuthenticationError") {
      msg = "Clave de Stripe inválida. Revisa STRIPE_SECRET_KEY en Vercel.";
    }
    console.error("[checkout] Stripe error:", type, err?.code, err?.message);
    return NextResponse.json({ error: msg, stripeType: type || undefined }, { status: 500 });
  }
}
