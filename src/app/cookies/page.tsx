import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export const metadata = { title: "Política de Cookies · MediaPlayPromo" };

export default function CookiesPage() {
  return (
    <LegalLayout title="Política de Cookies" updated="4 de junio de 2026" currentPath="/cookies">
      <p>Esta política explica qué cookies y tecnologías similares usamos en MediaPlayPromo.com y cómo gestionarlas.</p>

      <LegalSection n="1." title="¿Qué son las cookies?">
        <p>Pequeños archivos que se guardan en tu dispositivo para recordar información (sesión, preferencias) y mejorar tu experiencia.</p>
      </LegalSection>

      <LegalSection n="2." title="Cookies que usamos">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-white">Esenciales</strong>: sesión de usuario (Supabase Auth), tema claro/oscuro, carrito/checkout. Necesarias para funcionar.</li>
          <li><strong className="text-white">Funcionales</strong>: preferencias de idioma, ajustes guardados.</li>
          <li><strong className="text-white">Analíticas</strong> (si se activan): métricas de uso agregadas para mejorar la plataforma.</li>
          <li><strong className="text-white">Pago</strong>: Stripe usa cookies para prevención de fraude durante el checkout.</li>
        </ul>
      </LegalSection>

      <LegalSection n="3." title="Almacenamiento local">
        <p>Usamos <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300 text-xs">localStorage</code> para guardar tu sesión, tema y preferencias (p. ej. carpeta de descargas, banners). Estos datos quedan en tu navegador.</p>
      </LegalSection>

      <LegalSection n="4." title="Gestionar cookies">
        <p>Puedes borrar o bloquear cookies desde la configuración de tu navegador. Ten en cuenta que desactivar las esenciales puede impedir el inicio de sesión o el pago.</p>
      </LegalSection>

      <LegalSection n="5." title="Terceros">
        <p>Servicios como Stripe, Supabase y Vercel pueden establecer sus propias cookies según sus políticas. Consulta sus avisos de privacidad para más detalle.</p>
      </LegalSection>
    </LegalLayout>
  );
}
