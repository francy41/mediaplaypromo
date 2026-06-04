import { ImageResponse } from "next/og";

export const alt = "MediaPlayPromo — Plataforma IA de Video, Imagen y Marketing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0d0620 0%, #1c0a3a 50%, #08041a 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 40 }}>
          <svg width="84" height="84" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="32" fill="#16213e" />
            <path d="M14 18 L30 32 L14 46 Z" fill="none" stroke="#5c7cfa" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M50 18 L34 32 L50 46 Z" fill="none" stroke="#f03e3e" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="24" cy="32" r="2.2" fill="#5c7cfa" />
            <circle cx="40" cy="32" r="2.2" fill="#ff8787" />
            <path d="M29.5 25 L38 32 L29.5 39 Z" fill="#7048e8" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#fff", fontSize: 36, fontWeight: 900, lineHeight: 1 }}>MediaPlay<span style={{ fontWeight: 400 }}>Promo</span></span>
            <span style={{ color: "#94a3b8", fontSize: 16, fontWeight: 600, letterSpacing: 4 }}>.COM</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "#fff", fontSize: 64, fontWeight: 900, lineHeight: 1.05 }}>
            Genera Video e Imagen
          </span>
          <span style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.05, color: "#c084fc" }}>
            con Inteligencia Artificial
          </span>
        </div>

        <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 28, marginTop: 28 }}>
          Veo · Kling · Sora · Flux  ·  Productos digitales  ·  Afiliados  ·  Marca blanca
        </span>

        {/* Bottom badges */}
        <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
          {["IA Premium", "Desde €0", "Pago seguro"].map((b) => (
            <div
              key={b}
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 999,
                padding: "10px 24px",
                color: "#fff",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {b}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
