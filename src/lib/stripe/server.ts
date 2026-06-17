import Stripe from "stripe";

/**
 * Cliente Stripe server-side.
 * Requiere STRIPE_SECRET_KEY. Si no está, stripe será null y los endpoints
 * devuelven un error claro ("pasarela no configurada").
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  // .trim() por si la key se pegó en Vercel con un salto de línea o espacio (causa fallos raros)
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  _stripe = new Stripe(key, {
    typescript: true,
    // Cliente Fetch: en Vercel/serverless el cliente HTTP de Node a veces falla la conexión
    // ("StripeConnectionError"). El fetch client es estable en este entorno.
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 2,
    timeout: 20000,
  });
  return _stripe;
}

export const STRIPE_ENABLED = !!process.env.STRIPE_SECRET_KEY;

/** Mapea el periodo de facturación a config de recurrencia de Stripe */
export function billingToRecurring(
  period: "monthly" | "6months" | "yearly" | "lifetime"
): Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring | undefined {
  switch (period) {
    case "monthly":  return { interval: "month", interval_count: 1 };
    case "6months":  return { interval: "month", interval_count: 6 };
    case "yearly":   return { interval: "year",  interval_count: 1 };
    case "lifetime": return undefined; // pago único
    default:         return undefined;
  }
}
