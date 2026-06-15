"use client";
import { useEffect, useRef, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { X, Loader2 } from "lucide-react";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

/** Instancia de Stripe Embedded Checkout (tipos no incluidos en esta versión del SDK) */
interface EmbeddedCheckoutInstance {
  mount: (el: HTMLElement | string) => void;
  unmount: () => void;
  destroy: () => void;
}
type StripeWithEmbedded = {
  initEmbeddedCheckout: (opts: { clientSecret: string }) => Promise<EmbeddedCheckoutInstance>;
};

let _stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!PUBLISHABLE_KEY) return Promise.resolve(null);
  if (!_stripePromise) _stripePromise = loadStripe(PUBLISHABLE_KEY);
  return _stripePromise;
}

/** ¿El pago embebido está disponible? (requiere la clave pública) */
export const EMBEDDED_AVAILABLE = !!PUBLISHABLE_KEY;

/**
 * Modal con Stripe Embedded Checkout — el comprador paga sin salir de la web.
 * Recibe el clientSecret de una sesión creada con ui_mode: "embedded".
 */
export function EmbeddedCheckoutModal({ clientSecret, onClose }: { clientSecret: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let checkout: EmbeddedCheckoutInstance | undefined;

    getStripe()
      .then(async (stripe) => {
        if (!stripe) { setError("Falta la clave pública de Stripe."); return; }
        if (!active) return;
        checkout = await (stripe as unknown as StripeWithEmbedded).initEmbeddedCheckout({ clientSecret });
        if (!active) { checkout.destroy(); return; }
        if (ref.current) { checkout.mount(ref.current); setLoading(false); }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar el pago."));

    return () => {
      active = false;
      try { checkout?.destroy(); } catch { /* noop */ }
    };
  }, [clientSecret]);

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/75 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-xl my-6">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white text-black shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl min-h-[420px]">
          {error && <div className="p-8 text-center text-sm text-red-600">{error}</div>}
          {!error && loading && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin" /> Cargando pago seguro...
            </div>
          )}
          <div ref={ref} className="p-1" />
        </div>
      </div>
    </div>
  );
}
