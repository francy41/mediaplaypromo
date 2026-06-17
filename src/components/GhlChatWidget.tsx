import Script from "next/script";

/**
 * Widget de Chat de GoHighLevel (Live Chat).
 * Las conversaciones caen en GHL → Conversations (mismo inbox que IG/FB/TikTok/Email).
 *
 * Se activa SOLO si está definido NEXT_PUBLIC_GHL_CHAT_WIDGET_ID en el entorno.
 * El ID se obtiene en GHL → Sites → Chat Widget (está en el snippet `data-widget-id`).
 */
export function GhlChatWidget() {
  const widgetId = process.env.NEXT_PUBLIC_GHL_CHAT_WIDGET_ID;
  if (!widgetId) return null;

  return (
    <Script
      src="https://beta.leadconnectorhq.com/loader.js"
      data-resources-url="https://beta.leadconnectorhq.com/chat-widget/loader.js"
      data-widget-id={widgetId}
      strategy="afterInteractive"
    />
  );
}
