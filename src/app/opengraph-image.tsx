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
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: "linear-gradient(135deg, #fb923c, #ea580c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 900,
              color: "#fff",
            }}
          >
            M
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#fff", fontSize: 34, fontWeight: 800, lineHeight: 1 }}>MEDIAPLAY</span>
            <span style={{ color: "#fb923c", fontSize: 18, fontWeight: 700, letterSpacing: 6 }}>PROMO.COM</span>
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
