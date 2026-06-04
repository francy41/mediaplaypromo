import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";

export const metadata: Metadata = {
  metadataBase: new URL("https://mediaplaypromo.com"),
  title: {
    default: "MediaPlayPromo — Plataforma IA de Video, Imagen y Marketing",
    template: "%s · MediaPlayPromo",
  },
  description: "Genera videos e imágenes con IA (Veo, Kling, Sora, Flux), vende productos digitales, gestiona afiliados y marca blanca. Todo en una plataforma. Desde €0.",
  keywords: ["generador de video IA", "generador de imagen IA", "Veo 3", "Kling", "Sora", "marketing digital", "afiliados", "marca blanca", "SaaS IA", "MediaPlayPromo"],
  authors: [{ name: "MediaPlayPromo" }],
  creator: "MediaPlayPromo",
  applicationName: "MediaPlayPromo",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://mediaplaypromo.com",
    siteName: "MediaPlayPromo",
    title: "MediaPlayPromo — Plataforma IA de Video, Imagen y Marketing",
    description: "Genera videos e imágenes con IA, vende productos digitales y gana con afiliados. La suite todo-en-uno para creadores y agencias.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MediaPlayPromo — Plataforma IA de Video e Imagen",
    description: "Genera videos e imágenes con IA. Vende productos digitales. Gana con afiliados.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport = {
  themeColor: "#070809",
  width: "device-width",
  initialScale: 1,
};

// Run before hydration to avoid theme flicker
const themeBootScript = `
(function() {
  try {
    var t = localStorage.getItem('mpp_theme');
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.add(t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
