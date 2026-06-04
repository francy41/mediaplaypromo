import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export const metadata = { title: "Política de Reembolsos · MediaPlayPromo" };

export default function RefundsPage() {
  return (
    <LegalLayout title="Política de Reembolsos" updated="4 de junio de 2026" currentPath="/refunds">
      <p>
        Queremos que estés satisfecho con MediaPlayPromo. Esta política explica cuándo procede un reembolso.
        Dado que vendemos <strong className="text-white">productos digitales y servicios de generación con IA de consumo inmediato</strong>, aplican condiciones específicas.
      </p>

      <LegalSection n="1." title="Garantía de satisfacción (suscripciones)">
        <ul className="list-disc pl-5 space-y-1">
          <li>Ofrecemos <strong className="text-white">14 días de garantía</strong> en la primera compra de una suscripción si <strong className="text-white">no has consumido créditos</strong> de generación.</li>
          <li>Si ya generaste contenido (consumiste créditos / descargaste el producto), se considera servicio prestado y no procede reembolso del periodo en curso.</li>
        </ul>
      </LegalSection>

      <LegalSection n="2." title="Productos digitales / software">
        <p>Los productos digitales descargables (p. ej. YF AUTO CLIP) son <strong className="text-white">no reembolsables una vez descargados o activada la licencia</strong>, al tratarse de contenido digital de entrega inmediata. Antes de comprar, revisa la descripción y los requisitos.</p>
      </LegalSection>

      <LegalSection n="3." title="Créditos de IA consumidos">
        <p>Los créditos usados en generaciones (video/imagen/voz) <strong className="text-white">no son reembolsables</strong>, ya que conllevan un coste real de procesamiento. Si una generación falla por un error técnico nuestro, te reembolsamos los créditos de esa generación.</p>
      </LegalSection>

      <LegalSection n="4." title="Renovaciones automáticas">
        <p>Las renovaciones se cobran automáticamente. <strong className="text-white">Cancela antes de la fecha de renovación</strong> para evitar el cobro. No reembolsamos renovaciones ya cobradas salvo error demostrable, pero puedes cancelar para que no se renueve de nuevo.</p>
      </LegalSection>

      <LegalSection n="5." title="Cómo solicitar un reembolso">
        <p>Escribe a <a href="mailto:soporte@mediaplaypromo.com" className="text-cyan-400 hover:underline">soporte@mediaplaypromo.com</a> con tu email de compra y el motivo. Respondemos en un máximo de 5 días hábiles. Los reembolsos aprobados se realizan al método de pago original vía Stripe (3-10 días hábiles según tu banco).</p>
      </LegalSection>

      <LegalSection n="6." title="Excepciones por ley">
        <p>Si la legislación de tu país (p. ej. derecho de desistimiento de la UE) te otorga derechos adicionales, los respetaremos. El derecho de desistimiento puede no aplicar a contenido digital cuya ejecución haya comenzado con tu consentimiento expreso.</p>
      </LegalSection>
    </LegalLayout>
  );
}
