import { NextRequest, NextResponse } from "next/server";
import { getStripe, billingToRecurring } from "@/lib/stripe/server";
import { getProductBySlug } from "@/lib/products";

/**
 * POST /api/checkout
 * Crea una sesión de Stripe Checkout para un producto + tier.
 *
 * Body: { productSlug, tierId, email?, origin }
 * Devuelve: { url } (redirigir el navegador ahí)
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
    const { productSlug, tierId, email, origin } = await req.json();

    const product = getProductBySlug(productSlug);
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    const tier = product.prices.find((p) => p.id === tierId);
    if (!tier) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const baseUrl = origin || process.env.NEXT_PUBLIC_SITE_URL || "https://mediaplaypromo.com";
    const recurring = billingToRecurring(tier.billingPeriod);
    const isSubscription = !!recurring;

    // Precio en céntimos (EUR)
    const unitAmount = Math.round(tier.price * 100);

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
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
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/categories/${product.categorySlug}/${product.slug}?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error creando checkout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
