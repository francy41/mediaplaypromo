import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export const metadata = { title: "Política de Privacidad · MediaPlayPromo" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Política de Privacidad" updated="4 de junio de 2026" currentPath="/privacy">
      <p>
        En <strong className="text-white">MediaPlayPromo.com</strong> respetamos tu privacidad y cumplimos con el RGPD (UE) y normativas aplicables.
        Esta política explica qué datos recopilamos, cómo los usamos y tus derechos.
      </p>

      <LegalSection n="1." title="Responsable del tratamiento">
        <p>MediaPlayPromo.com es responsable del tratamiento de tus datos. Contacto: <a href="mailto:privacy@mediaplaypromo.com" className="text-cyan-400 hover:underline">privacy@mediaplaypromo.com</a>.</p>
      </LegalSection>

      <LegalSection n="2." title="Datos que recopilamos">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-white">Cuenta</strong>: email, nombre, contraseña (cifrada).</li>
          <li><strong className="text-white">Pagos</strong>: gestionados por Stripe. Recibimos confirmación e importes, NO los datos completos de tu tarjeta.</li>
          <li><strong className="text-white">Uso</strong>: prompts, generaciones, créditos consumidos, historial de compras.</li>
          <li><strong className="text-white">Técnicos</strong>: IP, navegador, cookies, métricas de uso.</li>
        </ul>
      </LegalSection>

      <LegalSection n="3." title="Cómo usamos tus datos">
        <ul className="list-disc pl-5 space-y-1">
          <li>Prestar el servicio (autenticación, generación IA, entrega de productos).</li>
          <li>Procesar pagos y gestionar suscripciones.</li>
          <li>Soporte, comunicaciones del servicio y, si lo consientes, marketing.</li>
          <li>Prevención de fraude y cumplimiento legal.</li>
          <li>Mejorar la plataforma con datos agregados/anonimizados.</li>
        </ul>
      </LegalSection>

      <LegalSection n="4." title="Base legal">
        <p>Tratamos tus datos para: ejecutar el contrato (servicio que contratas), tu consentimiento (marketing), interés legítimo (seguridad, mejora) y obligaciones legales (facturación).</p>
      </LegalSection>

      <LegalSection n="5." title="Proveedores y transferencias">
        <p>Compartimos datos solo con proveedores necesarios para operar:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-white">Stripe</strong> — procesamiento de pagos.</li>
          <li><strong className="text-white">Supabase</strong> — autenticación y base de datos.</li>
          <li><strong className="text-white">Vercel</strong> — hosting de la aplicación.</li>
          <li><strong className="text-white">Proveedores de IA</strong> (Muapi y modelos asociados) — procesan tus prompts para generar contenido.</li>
        </ul>
        <p>Algunos proveedores pueden estar fuera del EEE; en tal caso aplicamos garantías adecuadas (cláusulas contractuales tipo).</p>
      </LegalSection>

      <LegalSection n="6." title="Conservación">
        <p>Conservamos tus datos mientras tengas cuenta activa y el tiempo legal exigido (p. ej. facturas: 5-6 años). Puedes solicitar la eliminación en cualquier momento.</p>
      </LegalSection>

      <LegalSection n="7." title="Tus derechos (RGPD)">
        <p>Tienes derecho a: acceso, rectificación, supresión, oposición, limitación y portabilidad de tus datos, así como a retirar el consentimiento. Ejerce tus derechos en <a href="mailto:privacy@mediaplaypromo.com" className="text-cyan-400 hover:underline">privacy@mediaplaypromo.com</a>. También puedes reclamar ante la autoridad de protección de datos de tu país.</p>
      </LegalSection>

      <LegalSection n="8." title="Seguridad">
        <p>Aplicamos cifrado, control de acceso y buenas prácticas. Ningún sistema es 100% infalible, pero protegemos tus datos con medidas técnicas y organizativas razonables.</p>
      </LegalSection>

      <LegalSection n="9." title="Menores">
        <p>El servicio no está dirigido a menores de edad. No recopilamos conscientemente datos de menores.</p>
      </LegalSection>

      <LegalSection n="10." title="Cambios">
        <p>Podemos actualizar esta política. Te notificaremos los cambios relevantes. La fecha de actualización figura arriba.</p>
      </LegalSection>
    </LegalLayout>
  );
}
