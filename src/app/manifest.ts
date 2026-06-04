import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MediaPlayPromo — Plataforma IA",
    short_name: "MediaPlayPromo",
    description: "Genera videos e imágenes con IA, vende productos digitales y gana con afiliados.",
    start_url: "/",
    display: "standalone",
    background_color: "#070809",
    theme_color: "#070809",
    orientation: "portrait-primary",
    categories: ["productivity", "business", "multimedia"],
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
