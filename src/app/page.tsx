import Link from "next/link";
import { ArrowRight, Check, Zap, Shield, Globe, Users, BarChart3, Star } from "lucide-react";

const products = [
  {
    name: "Audio Replace",
    description: "Reemplaza el audio de tus videos automáticamente. Importa, sincroniza y exporta en segundos.",
    icon: "🎵",
    color: "from-cyan-500/20 to-blue-500/10",
    border: "border-cyan-500/20",
    features: ["Reconocimiento automático", "Sincronización exacta", "Multi-formato compatible"],
    badge: null,
  },
  {
    name: "Clip Cutter",
    description: "Corta, divide y organiza tus proyectos de video. Edición automática al segundo.",
    icon: "✂️",
    color: "from-pink-500/20 to-purple-500/10",
    border: "border-pink-500/20",
    features: ["Corte por fotograma", "Edición automática", "Exportación en lotes"],
    badge: "POPULAR",
  },
  {
    name: "Format Converter",
    description: "Convierte entre todos los formatos de video optimizados para YouTube, TikTok e Instagram.",
    icon: "🔄",
    color: "from-green-500/20 to-teal-500/10",
    border: "border-green-500/20",
    features: ["GPU acelerado", "Optimizado para TikTok/YT", "Conversión simple"],
    badge: null,
  },
];

const whyItems = [
  { icon: Zap, title: "Ahorra Tiempo", desc: "Automatiza procesos que antes tomaban horas.", color: "text-yellow-400" },
  { icon: BarChart3, title: "Aumenta Productividad", desc: "Flujos de trabajo más rápidos y eficientes.", color: "text-cyan-400" },
  { icon: Star, title: "Resultados Profesionales", desc: "Calidad de estudio en cada operación.", color: "text-purple-400" },
  { icon: Shield, title: "Contenido Visual", desc: "Mejora tu presencia visual en todas las plataformas.", color: "text-green-400" },
  { icon: Globe, title: "100% Seguro", desc: "Privacidad garantizada en todos tus archivos.", color: "text-blue-400" },
  { icon: Users, title: "Fácil de Usar", desc: "Interfaz intuitiva para cualquier nivel.", color: "text-orange-400" },
];

const steps = [
  { n: "1", title: "Sube tu Video", desc: "Arrastra o selecciona tu archivo de video." },
  { n: "2", title: "Consulta el Panel", desc: "Elige la herramienta y configura opciones." },
  { n: "3", title: "Automatiza el Proceso", desc: "El sistema procesa todo automáticamente." },
  { n: "4", title: "Exporta y Publica", desc: "Descarga el resultado y publícalo directo." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070809] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#070809]/80 backdrop-blur border-b border-white/8 flex items-center px-8 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black text-white">
            M
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">MEDIA</div>
            <div className="text-cyan-400 text-[9px] font-semibold tracking-widest">PLAY PROMO</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/login" className="text-white/60 hover:text-white text-sm transition-colors">
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Ver Productos
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 text-xs text-cyan-400 mb-6">
          <Zap className="w-3 h-3" />
          SUITE PROFESIONAL PARA CREADORES
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-4 max-w-3xl mx-auto">
          CREA. EDITA.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AUTOMATIZA.</span><br />
          DOMINA TU CONTENIDO.
        </h1>
        <p className="text-white/50 text-lg max-w-2xl mx-auto mb-8">
          Herramientas digitales profesionales para creadores que quieren ahorrar tiempo, automatizar procesos y generar contenido de alto impacto.
        </p>
        <div className="flex items-center justify-center gap-4 mb-4">
          <Link
            href="/register"
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
          >
            VER PRODUCTOS <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="border border-white/20 hover:border-white/40 text-white px-6 py-3 rounded-xl transition-colors"
          >
            EXPLORAR YF AUTO CLIP
          </Link>
        </div>
        <div className="flex items-center justify-center gap-6 text-xs text-white/40">
          <span>✓ Rendimiento Pro</span>
          <span>✓ Multi-formato</span>
          <span>✓ 100% Seguro</span>
        </div>
      </section>

      {/* Products */}
      <section className="px-8 pb-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-cyan-400 text-sm font-semibold tracking-wider mb-2">3 HERRAMIENTAS. INFINITAS POSIBILIDADES.</p>
          <h2 className="text-3xl font-bold">
            Descubre nuestra suite de herramientas diseñadas específicamente para maximizar<br />
            tu eficiencia y calidad de contenido.
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.name}
              className={`bg-gradient-to-br ${p.color} border ${p.border} rounded-2xl p-6 relative`}
            >
              {p.badge && (
                <span className="absolute top-4 right-4 bg-pink-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  {p.badge}
                </span>
              )}
              <div className="text-3xl mb-3">{p.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{p.name}</h3>
              <p className="text-white/50 text-sm mb-4">{p.description}</p>
              <ul className="space-y-1.5 mb-5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-white/70">
                    <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="text-cyan-400 text-xs font-semibold hover:text-cyan-300 transition-colors"
              >
                VER DETALLES →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="px-8 pb-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">
            POR QUÉ ELEGIR <span className="text-cyan-400">YF AUTO CLIP</span>
          </h2>
          <p className="text-white/40 text-sm mt-2">
            Diseñado para creadores que valoran su tiempo y buscan resultados profesionales sin complicaciones.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {whyItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-white/3 border border-white/8 rounded-xl p-5 hover:bg-white/5 transition-colors">
                <Icon className={`w-6 h-6 ${item.color} mb-3`} />
                <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                <p className="text-white/40 text-sm">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="px-8 pb-20 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">¿CÓMO FUNCIONA?</h2>
          <p className="text-white/40 text-sm mt-2">
            Un flujo de trabajo optimizado para que pases menos tiempo editando y más tiempo creando.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.n} className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-lg mx-auto mb-3">
                {step.n}
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">{step.title}</h3>
              <p className="text-white/40 text-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 pb-24 max-w-3xl mx-auto text-center">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-10">
          <h2 className="text-3xl font-black mb-3">Empieza gratis hoy</h2>
          <p className="text-white/50 mb-6">Sin tarjeta de crédito. Sin compromisos. Solo resultados.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-3.5 rounded-xl transition-colors text-sm"
          >
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 px-8 py-6 text-center">
        <p className="text-white/30 text-xs">© 2025 MediaPlayPromo.com — Todos los derechos reservados</p>
      </footer>
    </div>
  );
}
