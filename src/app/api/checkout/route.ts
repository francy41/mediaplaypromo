import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, billingToRecurring } from "@/lib/stripe/server";
import { getProductBySlug } from "@/lib/products";

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
    const { productSlug, tierId, email, origin, embedded } = await req.json();

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
      },
      ...(isSubscription
        ? { subscription_data: { metadata: { productSlug, tierId } } }
        : {}),
      allow_promotion_codes: true,
    };

    if (embedded) {
      // Pago embebido: el comprador paga dentro de la propia web (modal)
      const session = await stripe.checkout.sessions.create({
        ...baseParams,
        ui_mode: "embedded",
        return_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      } as unknown as Stripe.Checkout.SessionCreateParams);
      return NextResponse.json({ clientSecret: session.client_secret });
    }

    // Modo redirección (fallback): lleva a la página hospedada de Stripe
    const session = await stripe.checkout.sessions.create({
      ...baseParams,
      billing_address_collection: "auto",
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/categories/${product.categorySlug}/${product.slug}?canceled=1`,
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error creando checkout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
