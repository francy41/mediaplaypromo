import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import type Stripe from "stripe";

/**
 * POST /api/stripe/webhook
 * Recibe eventos de Stripe (pago completado, suscripción, etc.)
 * Configura el endpoint en: dashboard.stripe.com → Developers → Webhooks
 * URL: https://mediaplaypromo.com/api/stripe/webhook
 * Eventos: checkout.session.completed, invoice.paid, customer.subscription.deleted
 *
 * Requiere STRIPE_WEBHOOK_SECRET (whsec_...).
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // Sin secret configurado: parsea sin verificar (solo dev)
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Firma inválida";
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata ?? {};
        console.log("✅ Pago completado:", {
          product: meta.productName,
          tier: meta.tierName,
          email: session.customer_email,
          amount: session.amount_total,
        });
        // TODO (cuando Supabase tenga tablas): insertar en `payments`,
        // activar suscripción del usuario, asignar créditos según el plan.
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("💰 Factura pagada:", invoice.id, invoice.amount_paid);
        // TODO: renovar créditos del periodo
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        console.log("🚫 Suscripción cancelada:", sub.id);
        // TODO: marcar suscripción como canceled en DB
        break;
      }
      default:
        // otros eventos ignorados
        break;
    }
  } catch (e) {
    console.error("Error procesando webhook:", e);
  }

  return NextResponse.json({ received: true });
}
