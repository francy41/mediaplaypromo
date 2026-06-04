import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export const metadata = { title: "Términos y Condiciones · MediaPlayPromo" };

export default function TermsPage() {
  return (
    <LegalLayout title="Términos y Condiciones" updated="4 de junio de 2026" currentPath="/terms">
      <p>
        Bienvenido a <strong className="text-white">MediaPlayPromo.com</strong> (&ldquo;la Plataforma&rdquo;, &ldquo;nosotros&rdquo;).
        Al acceder, registrarte o comprar cualquiera de nuestros productos y servicios aceptas estos Términos y Condiciones en su totalidad.
        Si no estás de acuerdo, no utilices la Plataforma.
      </p>

      <LegalSection n="1." title="Descripción del servicio">
        <p>MediaPlayPromo es una plataforma SaaS de marketing digital e inteligencia artificial que ofrece:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Generación de <strong className="text-white">video e imagen con IA</strong> (modelos como Veo, Kling, Sora, Flux y otros, a través de proveedores externos).</li>
          <li>Venta de <strong className="text-white">productos digitales y software</strong> (p. ej. YF AUTO CLIP y sus herramientas).</li>
          <li>Suscripciones mensuales, semestrales y anuales con créditos de uso.</li>
          <li>Sistema de afiliados, marca blanca (white-label) y herramientas de automatización.</li>
        </ul>
      </LegalSection>

      <LegalSection n="2." title="Cuentas y registro">
        <p>Para usar funciones de pago debes crear una cuenta con datos veraces. Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad bajo tu cuenta. Debes tener al menos 18 años o la mayoría de edad legal en tu jurisdicción.</p>
      </LegalSection>

      <LegalSection n="3." title="Suscripciones, créditos y facturación">
        <ul className="list-disc pl-5 space-y-1">
          <li>Las suscripciones se renuevan automáticamente al final de cada periodo (mensual / semestral / anual) salvo que canceles antes.</li>
          <li>Los <strong className="text-white">créditos</strong> incluidos en cada plan se renuevan al inicio del periodo y <strong className="text-white">caducan al finalizar el periodo</strong>; no son acumulables salvo indicación expresa.</li>
          <li>Los pagos se procesan de forma segura a través de <strong className="text-white">Stripe</strong>. No almacenamos datos completos de tarjetas.</li>
          <li>Los precios pueden incluir o no impuestos según tu país; se mostrarán antes de confirmar la compra.</li>
          <li>Puedes cancelar en cualquier momento desde tu panel; conservarás el acceso hasta el final del periodo ya pagado.</li>
        </ul>
      </LegalSection>

      <LegalSection n="4." title="Productos digitales y licencias">
        <p>Los productos digitales (software, plantillas, packs) se entregan mediante descarga o acceso online. Salvo que se indique lo contrario:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>La licencia es <strong className="text-white">personal e intransferible</strong> (o comercial/agencia según el plan adquirido).</li>
          <li>No está permitido revender, redistribuir ni compartir el producto fuera de los términos de tu licencia.</li>
          <li>Las licencias de agencia/marca blanca permiten reventa solo bajo las condiciones específicas de ese plan.</li>
        </ul>
      </LegalSection>

      <LegalSection n="5." title="Generación de contenido con IA">
        <ul className="list-disc pl-5 space-y-1">
          <li>El contenido generado depende de proveedores de IA externos; no garantizamos resultados específicos, exactitud ni idoneidad para un fin concreto.</li>
          <li>Eres responsable de los <strong className="text-white">prompts</strong> que introduces y del uso que das al contenido generado.</li>
          <li>Queda <strong className="text-white">prohibido</strong> generar contenido ilegal, difamatorio, que infrinja derechos de autor o marcas, deepfakes no consentidos, contenido sexual de menores, violento extremo, o que suplante identidades sin permiso.</li>
          <li>Los derechos sobre el contenido generado se rigen además por los términos de cada proveedor de IA subyacente.</li>
          <li>Una generación consume créditos aunque el resultado no sea de tu agrado, salvo fallo técnico comprobado por nuestra parte.</li>
        </ul>
      </LegalSection>

      <LegalSection n="6." title="Uso aceptable">
        <p>Te comprometes a no: (a) usar la Plataforma para actividades ilegales; (b) intentar vulnerar la seguridad o acceder a cuentas ajenas; (c) revender el acceso sin autorización; (d) sobrecargar la infraestructura con automatizaciones abusivas; (e) infringir derechos de terceros. Podemos suspender cuentas que incumplan.</p>
      </LegalSection>

      <LegalSection n="7." title="Sistema de afiliados">
        <p>Los afiliados ganan comisiones según las reglas vigentes publicadas en su panel. Las comisiones por fraude, autocompras o tráfico no válido serán anuladas. Los pagos de comisiones están sujetos a verificación y a un mínimo de retiro.</p>
      </LegalSection>

      <LegalSection n="8." title="Marca blanca (White-Label)">
        <p>Los clientes de marca blanca pueden ofrecer nuestros servicios bajo su propia marca según el plan contratado. Son responsables del trato con sus propios clientes finales y del cumplimiento legal en su jurisdicción. MediaPlayPromo opera la infraestructura subyacente.</p>
      </LegalSection>

      <LegalSection n="9." title="Propiedad intelectual">
        <p>La Plataforma, su diseño, marca, código y contenido propio son propiedad de MediaPlayPromo. Tu compra te otorga una licencia de uso, no la propiedad del software ni de la Plataforma.</p>
      </LegalSection>

      <LegalSection n="10." title="Limitación de responsabilidad">
        <p>La Plataforma se ofrece &ldquo;tal cual&rdquo;. En la medida permitida por la ley, no seremos responsables de daños indirectos, pérdida de beneficios o datos. Nuestra responsabilidad máxima se limita al importe pagado por ti en los últimos 3 meses.</p>
      </LegalSection>

      <LegalSection n="11." title="Cancelación y terminación">
        <p>Puedes cerrar tu cuenta cuando quieras. Podemos suspender o cancelar cuentas que incumplan estos términos, sin reembolso en caso de incumplimiento grave.</p>
      </LegalSection>

      <LegalSection n="12." title="Cambios en los términos">
        <p>Podemos actualizar estos términos. Los cambios relevantes se notificarán por email o en la Plataforma. El uso continuado tras los cambios implica su aceptación.</p>
      </LegalSection>

      <LegalSection n="13." title="Ley aplicable y contacto">
        <p>Estos términos se rigen por la legislación española/de la UE salvo norma imperativa de tu país de residencia. Para cualquier consulta: <a href="mailto:legal@mediaplaypromo.com" className="text-cyan-400 hover:underline">legal@mediaplaypromo.com</a>.</p>
      </LegalSection>
    </LegalLayout>
  );
}
