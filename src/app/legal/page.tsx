import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export const metadata = { title: "Aviso Legal · MediaPlayPromo" };

export default function LegalNoticePage() {
  return (
    <LegalLayout title="Aviso Legal" updated="4 de junio de 2026" currentPath="/legal">
      <p>En cumplimiento de la normativa de servicios de la sociedad de la información, se facilita la siguiente información:</p>

      <LegalSection n="1." title="Datos identificativos">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-white">Titular</strong>: MediaPlayPromo</li>
          <li><strong className="text-white">Sitio web</strong>: https://mediaplaypromo.com</li>
          <li><strong className="text-white">Contacto</strong>: <a href="mailto:legal@mediaplaypromo.com" className="text-cyan-400 hover:underline">legal@mediaplaypromo.com</a></li>
          <li><strong className="text-white">Actividad</strong>: Plataforma SaaS de marketing digital, generación de contenido con IA y venta de productos digitales.</li>
        </ul>
      </LegalSection>

      <LegalSection n="2." title="Condiciones de uso">
        <p>El acceso y uso del sitio implica la aceptación de estos términos, de los <a href="/terms" className="text-cyan-400 hover:underline">Términos y Condiciones</a> y de la <a href="/privacy" className="text-cyan-400 hover:underline">Política de Privacidad</a>.</p>
      </LegalSection>

      <LegalSection n="3." title="Propiedad intelectual e industrial">
        <p>Todos los contenidos del sitio (textos, diseño, logotipos, software) son titularidad de MediaPlayPromo o de sus licenciantes y están protegidos por la normativa de propiedad intelectual. Queda prohibida su reproducción sin autorización.</p>
      </LegalSection>

      <LegalSection n="4." title="Responsabilidad">
        <p>MediaPlayPromo no se responsabiliza del mal uso de los contenidos generados por los usuarios ni de las decisiones tomadas en base a ellos. El usuario es responsable del contenido que crea y comparte.</p>
      </LegalSection>

      <LegalSection n="5." title="Enlaces externos">
        <p>El sitio puede contener enlaces a terceros. No nos responsabilizamos de sus contenidos ni políticas.</p>
      </LegalSection>

      <LegalSection n="6." title="Legislación aplicable">
        <p>Las relaciones entre MediaPlayPromo y los usuarios se rigen por la legislación española y de la UE. Para conflictos, las partes se someten a los juzgados que correspondan según la normativa de consumidores aplicable.</p>
      </LegalSection>
    </LegalLayout>
  );
}
