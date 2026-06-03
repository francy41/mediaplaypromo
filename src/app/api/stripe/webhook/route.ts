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

        // Registrar el pago en Supabase
        try {
          const { createSupabaseAdminClient } = await import("@/lib/supabase/server");
          const admin = createSupabaseAdminClient();
          const email = session.customer_email ?? session.customer_details?.email ?? null;

          // Buscar el user_id por email (si existe perfil)
          let userId: string | null = null;
          if (email) {
            const { data: profile } = await admin
              .from("profiles")
              .select("id")
              .eq("email", email.toLowerCase())
              .single();
            userId = profile?.id ?? null;
          }

          await admin.from("payments").insert({
            user_id: userId,
            amount: (session.amount_total ?? 0) / 100,
            currency: (session.currency ?? "eur").toUpperCase(),
            provider: "stripe",
            provider_payment_id: session.id,
            status: "completed",
            description: `${meta.productName ?? "Producto"} · ${meta.tierName ?? ""}`.trim(),
            metadata: { ...meta, stripe_session: session.id, email },
          });

          // Si hay usuario, actualizar su plan según el tier comprado
          if (userId && meta.tierId) {
            const planMap: Record<string, string> = {
              monthly: "pro", "6months": "pro", yearly: "pro",
              "v1-monthly": "starter", "v1-6months": "starter", "v1-yearly": "starter",
            };
            const newPlan = planMap[meta.tierId] ?? "pro";
            await admin.from("profiles").update({ plan: newPlan }).eq("id", userId);
          }

          console.log("💾 Pago registrado en DB");
        } catch (dbErr) {
          console.error("Error guardando pago en DB:", dbErr);
        }
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
