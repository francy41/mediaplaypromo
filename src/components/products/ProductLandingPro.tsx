"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowRight, Play, Sparkles, Zap, Layers, Shield, Clock, Volume2, Scissors,
  RefreshCw, CheckCircle2, TrendingUp, Trophy, Rocket, Hand, Upload, Sliders,
  Wand2, Download, Check, ShoppingCart, Crown, Loader2, Mail, Lock, LogIn, Copy, Ticket,
  Star, ChevronDown, Monitor, HardDrive, Users, ThumbsUp, XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Product } from "@/lib/products";
import { useAuth } from "@/lib/auth-context";
import { EmbeddedCheckoutModal, EMBEDDED_AVAILABLE } from "./EmbeddedCheckoutModal";

interface Props {
  product: Product;
}

/** Herramientas por defecto si el producto no define sub-productos */
const FALLBACK_TOOLS = [
  {
    name: "AUDIO REPLACE",
    icon: Volume2,
    accent: "cyan" as const,
    description: "Reemplaza audios de videos automáticamente de forma masiva y sincronizada.",
    features: ["Sincronización automática", "Reemplazo masivo", "Compatible con múltiples formatos", "Ideal para reels y contenido viral"],
  },
  {
    name: "CLIP CUTTER",
    icon: Scissors,
    accent: "pink" as const,
    description: "Corta, divide y organiza videos de forma profesional y precisa al segundo.",
    features: ["Corte preciso al segundo", "División automática", "Exportación rápida sin re-encode", "Vista previa instantánea"],
  },
  {
    name: "FORMAT CONVERTER",
    icon: RefreshCw,
    accent: "violet" as const,
    description: "Convierte videos a múltiples formatos y resoluciones para cualquier plataforma.",
    features: ["MP4, MOV, MKV, AVI, WEBM", "Optimizado para YouTube y TikTok", "Conversión rápida", "Calidad profesional"],
  },
];

const ACCENT: Record<string, { ring: string; text: string; bg: string; grad: string; shadow: string }> = {
  cyan: { ring: "border-cyan-500/30", text: "text-cyan-400", bg: "bg-cyan-500/15", grad: "from-cyan-400 to-blue-600", shadow: "shadow-cyan-500/30" },
  pink: { ring: "border-pink-500/40", text: "text-pink-400", bg: "bg-pink-500/15", grad: "from-pink-500 to-rose-600", shadow: "shadow-pink-500/30" },
  violet: { ring: "border-violet-500/30", text: "text-violet-400", bg: "bg-violet-500/15", grad: "from-violet-500 to-purple-700", shadow: "shadow-violet-500/30" },
};

const BENEFITS_FALLBACK: { icon: LucideIcon; title: string; description: string; tone: string }[] = [
  { icon: Clock, title: "AHORRA TIEMPO", description: "Automatiza tareas repetitivas y enfócate en crear.", tone: "text-cyan-400" },
  { icon: TrendingUp, title: "AUMENTA PRODUCTIVIDAD", description: "Procesa cientos de videos en minutos, no en horas.", tone: "text-violet-400" },
  { icon: Trophy, title: "RESULTADOS PROFESIONALES", description: "Calidad de estudio en cada exportación.", tone: "text-pink-400" },
  { icon: Rocket, title: "CONTENIDO MÁS VIRAL", description: "Formatos optimizados para el algoritmo de cada red.", tone: "text-orange-400" },
  { icon: Shield, title: "100% SEGURO", description: "Procesamiento local, tus archivos nunca se suben a la nube.", tone: "text-green-400" },
  { icon: Hand, title: "FÁCIL DE USAR", description: "Interfaz intuitiva, sin necesidad de experiencia previa.", tone: "text-blue-400" },
];

const TESTIMONIALS = [
  { name: "Carlos M.", role: "YouTuber · Venezuela", avatar: "CM", result: "Pasé de editar 3 horas a 20 minutos. Subí 40 clips en una semana.", rating: 5, tone: "from-cyan-500 to-blue-600" },
  { name: "María G.", role: "Creadora de Contenido · México", avatar: "MG", result: "Literalmente duplicé mi output de contenido. Mi canal creció un 60% en 2 meses.", rating: 5, tone: "from-pink-500 to-rose-600" },
  { name: "Roberto S.", role: "Agencia Digital · Colombia", avatar: "RS", result: "Manejamos 8 clientes con el mismo tiempo. YF Auto Clip es nuestro mejor activo.", rating: 5, tone: "from-violet-500 to-purple-600" },
  { name: "Ana P.", role: "TikToker · España", avatar: "AP", result: "Antes me tomaba todo el día editar. Ahora en 30 min tengo el contenido de la semana.", rating: 5, tone: "from-orange-500 to-amber-600" },
  { name: "Diego L.", role: "Creador de Reels · Argentina", avatar: "DL", result: "El procesamiento masivo es una locura. 100 clips en menos de 1 hora sin tocar nada.", rating: 5, tone: "from-teal-500 to-cyan-600" },
];

const FAQ_ITEMS = [
  {
    q: "¿Funciona en Mac o solo en Windows?",
    a: "Actualmente YF Auto Clip está optimizado para Windows 10 y Windows 11 (64-bit). La versión para Mac está en desarrollo y llegará próximamente. Te notificaremos cuando esté disponible.",
  },
  {
    q: "¿Cuántos videos puedo procesar a la vez?",
    a: "No hay límite oficial. Hemos probado lotes de 500+ videos sin problemas. El único límite es el espacio en tu disco y la capacidad de tu procesador.",
  },
  {
    q: "¿Necesito experiencia previa en edición de video?",
    a: "Para nada. YF Auto Clip está diseñado para que cualquiera lo use desde el primer día. La interfaz es visual e intuitiva — si puedes arrastrar un archivo, puedes usar el software.",
  },
  {
    q: "¿Las actualizaciones futuras están incluidas?",
    a: "Sí. Cada plan incluye actualizaciones durante el período de suscripción. El plan Lifetime incluye todas las actualizaciones de por vida sin costo adicional.",
  },
  {
    q: "¿Qué pasa si el software no funciona en mi computadora?",
    a: "Tienes 30 días de garantía total. Si por cualquier motivo no funciona correctamente en tu equipo, te devolvemos el dinero sin preguntas. Solo escríbenos a soporte@mediaplaypromo.com.",
  },
  {
    q: "¿Puedo usarlo en más de un equipo?",
    a: "El plan Básico permite 1 dispositivo. El plan Pro permite hasta 3 dispositivos simultáneos. El plan Agencia no tiene límite de dispositivos dentro de tu organización.",
  },
  {
    q: "¿Mis videos se suben a algún servidor?",
    a: "No. Todo el procesamiento es 100% local en tu computadora. Tus videos nunca salen de tu equipo, lo que garantiza privacidad total y velocidad máxima.",
  },
];

const STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Upload, title: "1. SUBE TU VIDEO", desc: "Importa uno o cientos de videos al instante." },
  { icon: Sliders, title: "2. CONFIGURA EL PANEL", desc: "Ajusta los parámetros según tus necesidades." },
  { icon: Wand2, title: "3. AUTOMATIZA EL PROCESO", desc: "Deja que el software haga el trabajo pesado." },
  { icon: Download, title: "4. EXPORTA Y PUBLICA", desc: "Obtén tus videos listos para volverse virales." },
];

export function ProductLandingPro({ product }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [buying, setBuying] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState<string | null>(null);
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const heroImg = product.coverImage;
  const offer = product.lifetimeOffer;
  const tools = product.subProducts?.length
    ? product.subProducts.map((sp, i) => ({
        name: sp.name,
        icon: sp.icon,
        accent: (["cyan", "pink", "violet"] as const)[i % 3],
        description: sp.description,
        features: sp.features,
      }))
    : FALLBACK_TOOLS;

  const benefits: { icon: LucideIcon; title: string; description: string; tone: string }[] =
    product.benefits.length >= 6
      ? product.benefits.slice(0, 6).map((b, i) => ({ icon: b.icon, title: b.title, description: b.description, tone: BENEFITS_FALLBACK[i].tone }))
      : BENEFITS_FALLBACK;

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const handleBuy = async (priceId: string) => {
    if (!user) { setShowLoginPrompt(priceId); return; }
    setBuying(priceId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          tierId: priceId,
          email: user.email,
          embedded: EMBEDDED_AVAILABLE,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "No se pudo iniciar el pago."); return; }
      if (data.clientSecret) { setCheckoutSecret(data.clientSecret); return; } // pago embebido
      if (data.url) window.location.href = data.url; // fallback: redirección
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error de conexión con el pago.");
    } finally {
      setBuying(null);
    }
  };

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Consulta sobre ${product.name}`);
    const body = encodeURIComponent(`Nombre: ${contact.name}\nEmail: ${contact.email}\n\n${contact.message}`);
    window.location.href = `mailto:soporte@mediaplaypromo.com?subject=${subject}&body=${body}`;
  };

  const minPrice = Math.min(...product.prices.map((p) => p.monthlyEquivalent ?? p.price));

  return (
    <div className="space-y-16 sm:space-y-24 pb-10">

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#070d1f] via-[#0d0620] to-[#08041a] cinematic-dark"
        style={{ backgroundColor: "#070d1f", color: "white" }}
      >
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none glow-pulse" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none float-soft" />
        <div className="particles-bg" />

        <div className="relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center p-6 sm:p-10 lg:p-14">
          {/* Left */}
          <div className="text-center lg:text-left">
            {product.comingSoon ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-fuchsia-500/20 border border-orange-500/40 text-orange-300 text-xs font-black tracking-wider uppercase mb-6 glow-pulse">
                <Rocket className="w-4 h-4" /> Muy pronto · Prepárate para el lanzamiento
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-cyan-500/20 text-cyan-300 text-xs font-bold tracking-wider uppercase mb-6">
                <Sparkles className="w-4 h-4" /> Suite profesional para creadores
              </div>
            )}

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-5">
              <span className="block text-white">CREA. EDITA.</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-pink-400 gradient-anim">AUTOMATIZA.</span>
              <span className="block text-white">DOMINA TU CONTENIDO.</span>
            </h1>

            <p className="text-white/60 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8">
              Herramientas digitales profesionales para creadores que quieren ahorrar tiempo, automatizar procesos y generar contenido de alto impacto.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button onClick={() => scrollTo("precios")}
                className="shine-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black px-8 h-14 rounded-full shadow-2xl shadow-cyan-500/30 ring-1 ring-white/20 transition-all hover:-translate-y-0.5 text-base"
              >
                VER PRODUCTOS <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => scrollTo("como-funciona")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 font-bold px-8 h-14 rounded-full transition-all text-base"
              >
                EXPLORAR {product.shortName ?? product.name} <Play className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm text-white/55 font-medium flex-wrap">
              <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400" /> Rendimiento Pro</span>
              <span className="flex items-center gap-2"><Layers className="w-4 h-4 text-fuchsia-400" /> Fácil de usar</span>
              <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-pink-400" /> 100% Seguro</span>
            </div>

            {/* Contador social */}
            <div className="mt-6 flex items-center justify-center lg:justify-start gap-3">
              <div className="flex -space-x-2">
                {["CM","MG","RS","AP","DL"].map((initials, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-[#070d1f] bg-gradient-to-br ${["from-cyan-500 to-blue-600","from-pink-500 to-rose-600","from-violet-500 to-purple-600","from-orange-500 to-amber-600","from-teal-500 to-cyan-600"][i]} flex items-center justify-center text-[9px] font-black text-white`}>
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                  <span className="text-amber-400 text-xs font-bold ml-1">5.0</span>
                </div>
                <p className="text-white/45 text-xs"><span className="text-white font-bold">+2,800 creadores</span> ya lo usan</p>
              </div>
            </div>
          </div>

          {/* Right — imagen subida (si existe) o maqueta 3D del producto */}
          {heroImg ? (
            <div className="relative float-soft">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-fuchsia-500/20 rounded-2xl blur-2xl" />
              <div className="relative glass-card rounded-2xl p-2 overflow-hidden shadow-2xl border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImg} alt={product.name} className="w-full h-auto rounded-xl object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.25"; }}
                />
              </div>
            </div>
          ) : (
            <ProductBoxMock product={product} />
          )}
        </div>
      </section>

      {/* ═══════════ TOOLS ═══════════ */}
      <section id="productos">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {tools.length} HERRAMIENTAS.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-pink-400">INFINITAS POSIBILIDADES.</span>
          </h2>
          <p className="text-white/50 text-base mt-3 max-w-2xl mx-auto">
            Una suite completa diseñada para crear, automatizar y publicar tu contenido sin complicaciones.
          </p>
        </div>

        {tools.length > 4 ? (
          /* Grid compacto (muchas herramientas) */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tools.map((tool, i) => {
              const Icon = tool.icon;
              const a = ACCENT[tool.accent];
              return (
                <div key={`${tool.name}-${i}`} className="glass-card hover-lift relative overflow-hidden rounded-2xl p-5 border-white/10 group">
                  <div className={`w-12 h-12 rounded-xl ${a.bg} border ${a.ring} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${a.text}`} />
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-white/30 font-black text-xs">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="text-white font-black text-sm tracking-wide">{tool.name}</h3>
                  </div>
                  <p className="text-white/50 text-xs leading-snug">{tool.description}</p>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid detallado (pocas herramientas) */
          <div className="grid md:grid-cols-3 gap-6">
            {tools.map((tool, i) => {
              const Icon = tool.icon;
              const a = ACCENT[tool.accent];
              const featured = tools.length === 3 && i === 1;
              return (
                <div key={`${tool.name}-${i}`}
                  className={`glass-card hover-lift relative overflow-hidden rounded-2xl p-7 group ${featured ? `${a.ring} shadow-2xl ${a.shadow}` : "border-white/10"}`}
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon className={`w-24 h-24 ${a.text}`} />
                  </div>
                  {featured && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent" />}

                  <div className={`relative w-14 h-14 rounded-xl ${a.bg} border ${a.ring} flex items-center justify-center mb-6`}>
                    <Icon className={`w-7 h-7 ${a.text}`} />
                  </div>
                  <h3 className="relative text-xl font-black text-white mb-3 tracking-wide">{tool.name}</h3>
                  <p className="relative text-white/55 text-sm mb-6 min-h-[64px]">{tool.description}</p>

                  <ul className="relative space-y-3 mb-7">
                    {tool.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className={`w-5 h-5 ${a.text} shrink-0 mt-0.5`} />
                        <span className="text-white/75">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button onClick={() => scrollTo("precios")}
                    className={`w-full inline-flex items-center justify-center gap-2 font-bold text-sm px-4 py-3 rounded-xl transition-all ${
                      featured
                        ? `bg-gradient-to-r ${a.grad} text-white shadow-lg ${a.shadow} ring-1 ring-white/20`
                        : "bg-white/5 hover:bg-white/10 text-white border border-white/15"
                    }`}
                  >
                    {featured ? "OBTENER AHORA" : "VER DETALLES"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════ BENEFITS ═══════════ */}
      <section id="beneficios" className="rounded-3xl border border-white/8 bg-white/[0.02] p-8 sm:p-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            POR QUÉ ELEGIR{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">{product.shortName ?? product.name}</span>
          </h2>
          <p className="text-white/50 text-base mt-3 max-w-2xl mx-auto">
            Diseñado para creadores que valoran su tiempo y buscan resultados profesionales sin complicaciones.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {benefits.map((b) => {
            const Icon = b.icon;
            const tone = b.tone;
            return (
              <div key={b.title} className="glass-card rounded-2xl p-6 flex flex-col items-center text-center group border-white/8">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className={`w-6 h-6 ${tone}`} />
                </div>
                <h4 className="font-black text-white text-sm uppercase tracking-wide mb-1.5">{b.title}</h4>
                <p className="text-white/45 text-xs leading-snug">{b.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section id="testimonios">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            LO QUE DICEN{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">NUESTROS CREADORES</span>
          </h2>
          <p className="text-white/50 text-base mt-3 max-w-2xl mx-auto">
            Más de 2,800 creadores de contenido ya transformaron su flujo de trabajo.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.slice(0, 3).map((t, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 border-white/10 flex flex-col gap-4">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-white/70 text-sm leading-relaxed italic">"{t.result}"</p>
              <div className="flex items-center gap-3 mt-auto">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.tone} flex items-center justify-center text-xs font-black text-white flex-shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-5 mt-5">
          {TESTIMONIALS.slice(3).map((t, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 border-white/10 flex flex-col gap-4">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-white/70 text-sm leading-relaxed italic">"{t.result}"</p>
              <div className="flex items-center gap-3 mt-auto">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.tone} flex items-center justify-center text-xs font-black text-white flex-shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="como-funciona">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            ¿CÓMO <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">FUNCIONA?</span>
          </h2>
          <p className="text-white/50 text-base mt-3 max-w-2xl mx-auto">
            Un flujo de trabajo optimizado para pasar menos tiempo editando y más tiempo creando.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          <div className="hidden md:block absolute top-10 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/30 to-cyan-500/10 z-0" />
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl glass-card border-cyan-500/20 flex items-center justify-center mb-5 shadow-lg shadow-cyan-500/10">
                  <Icon className="w-9 h-9 text-cyan-400" />
                </div>
                <h4 className="font-black text-white text-base mb-2">{step.title}</h4>
                <p className="text-white/50 text-sm">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════ BEFORE / AFTER ═══════════ */}
      <section className="rounded-3xl border border-white/8 bg-white/[0.02] p-8 sm:p-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            ANTES <span className="text-white/30">vs</span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">DESPUÉS</span>
          </h2>
          <p className="text-white/50 text-base mt-3 max-w-xl mx-auto">
            El mismo trabajo. El mismo contenido. La diferencia es el tiempo que tardas.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* ANTES */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-7">
            <div className="flex items-center gap-2 mb-6">
              <XCircle className="w-5 h-5 text-red-400" />
              <h3 className="text-red-400 font-black text-sm uppercase tracking-wider">Sin YF Auto Clip</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Editar video a video manualmente — 3 a 8 horas al día",
                "Errores humanos: cortes mal sincronizados, audio desfasado",
                "Imposible escalar sin contratar a alguien más",
                "Agotamiento creativo por tareas repetitivas",
                "1-3 publicaciones por semana como máximo",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/60">
                  <span className="text-red-400 font-black mt-0.5">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* DESPUÉS */}
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.06] p-7 shadow-lg shadow-cyan-500/10">
            <div className="flex items-center gap-2 mb-6">
              <ThumbsUp className="w-5 h-5 text-cyan-400" />
              <h3 className="text-cyan-400 font-black text-sm uppercase tracking-wider">Con YF Auto Clip</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Procesa 100 videos en menos de 1 hora — solo una vez",
                "Precisión total: cortes al segundo, audio sincronizado automáticamente",
                "Escala sin límites: mismo tiempo, infinito volumen de contenido",
                "Enfócate en crear ideas, no en editar clips",
                "10-20 publicaciones diarias sin esfuerzo adicional",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════════ TECH REQUIREMENTS ═══════════ */}
      <section className="rounded-3xl border border-white/8 bg-white/[0.02] p-8 sm:p-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            REQUISITOS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">TÉCNICOS</span>
          </h2>
          <p className="text-white/40 text-sm mt-2">Asegúrate de que tu equipo es compatible antes de comprar.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <div className="glass-card rounded-2xl p-6 border-white/10 flex flex-col gap-3">
            <Monitor className="w-8 h-8 text-cyan-400" />
            <h4 className="text-white font-bold text-sm uppercase tracking-wide">Sistema Operativo</h4>
            <ul className="text-white/55 text-xs space-y-1">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> Windows 10 (64-bit)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> Windows 11 (64-bit)</li>
              <li className="flex items-center gap-2 text-white/30"><XCircle className="w-3 h-3 text-red-400/60" /> macOS (próximamente)</li>
            </ul>
          </div>
          <div className="glass-card rounded-2xl p-6 border-white/10 flex flex-col gap-3">
            <HardDrive className="w-8 h-8 text-fuchsia-400" />
            <h4 className="text-white font-bold text-sm uppercase tracking-wide">Hardware Mínimo</h4>
            <ul className="text-white/55 text-xs space-y-1">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> CPU: Intel i5 / AMD Ryzen 5</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> RAM: 8 GB mínimo (16 GB recomendado)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> Disco: 2 GB libres para instalación</li>
            </ul>
          </div>
          <div className="glass-card rounded-2xl p-6 border-white/10 flex flex-col gap-3">
            <Users className="w-8 h-8 text-violet-400" />
            <h4 className="text-white font-bold text-sm uppercase tracking-wide">Dispositivos</h4>
            <ul className="text-white/55 text-xs space-y-1">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> Básico: 1 dispositivo</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> Pro: hasta 3 dispositivos</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-400" /> Agencia: sin límite</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING (real, conectado a Stripe) ═══════════ */}
      <section id="precios" className="rounded-3xl border-t border-white/8 pt-2">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            PLANES <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-pink-400">SIMPLES Y POTENTES</span>
          </h2>
          <p className="text-white/50 text-base mt-3 max-w-2xl mx-auto">
            Acceso completo desde <span className="text-cyan-400 font-bold">€{minPrice.toFixed(2)}/mes</span>. Elige el plan que mejor se adapte a tu flujo.
          </p>
        </div>

        {/* ── Cupón + contador 48h ── */}
        <CouponBanner code="YFAUTOCLIP" percent={20} slug={product.slug} />

        {/* ── Oferta especial de pago único (Lifetime) ── */}
        {offer && (
          <div className="max-w-4xl mx-auto mb-10">
            <div className="relative overflow-hidden rounded-3xl border border-pink-500/40 bg-gradient-to-br from-pink-500/10 via-fuchsia-500/[0.06] to-transparent p-7 sm:p-8 shadow-2xl shadow-pink-500/20">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                {offer.badge ?? "Oferta de lanzamiento"}
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="min-w-0 text-center md:text-left">
                  <h3 className="text-2xl font-black text-white mb-2">{offer.name}</h3>
                  <p className="text-white/55 text-sm mb-4 max-w-md">{offer.description}</p>
                  <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-white">€{offer.price}</span>
                      {offer.originalPrice && <span className="text-white/40 text-lg line-through">€{offer.originalPrice}</span>}
                    </div>
                    <span className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-sm font-bold border border-pink-500/30 glow-pulse">¡Últimos cupos!</span>
                  </div>
                </div>
                <button onClick={() => handleBuy(offer.id)} disabled={buying === offer.id}
                  className="shine-btn w-full md:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black h-14 px-8 rounded-xl shadow-2xl shadow-pink-500/30 ring-1 ring-white/20 text-base transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait"
                >
                  {buying === offer.id
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirigiendo...</>
                    : <>{offer.cta} <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-stretch">
          {product.prices.map((tier) => {
            const discount = tier.originalPrice
              ? Math.round(((tier.originalPrice - tier.price) / tier.originalPrice) * 100)
              : 0;
            const popular = tier.popular;
            return (
              <div key={tier.id}
                className={`glass-card relative overflow-hidden rounded-3xl p-7 flex flex-col ${
                  popular ? "border-cyan-500/50 shadow-2xl shadow-cyan-500/20 md:-translate-y-3 ring-1 ring-cyan-500/30" : "border-white/10"
                }`}
              >
                {tier.badge && (
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 text-white text-[9px] font-black px-3 py-1 rounded-b-lg uppercase tracking-widest ${popular ? "bg-gradient-to-r from-cyan-500 to-blue-600" : "bg-green-500"}`}>
                    {tier.badge}
                  </div>
                )}
                <h3 className={`text-lg font-black mb-2 mt-3 ${popular ? "text-cyan-400" : "text-white"}`}>{tier.name}</h3>
                <p className="text-white/45 text-xs mb-5 min-h-[32px]">{tier.description}</p>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-white font-black text-5xl">€{tier.price}</span>
                  <span className="text-white/40 text-sm">{tier.periodLabel}</span>
                </div>
                {tier.originalPrice && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white/30 text-sm line-through">€{tier.originalPrice}</span>
                    {discount > 0 && <span className="bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-black px-2 py-0.5 rounded-full">-{discount}%</span>}
                  </div>
                )}
                {tier.monthlyEquivalent && tier.billingPeriod !== "monthly" && (
                  <p className="text-white/40 text-xs mb-5">Equivale a <span className="text-white font-bold">€{tier.monthlyEquivalent.toFixed(2)}/mes</span></p>
                )}

                <ul className="space-y-3 mb-7 pt-5 border-t border-white/8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${popular ? "text-cyan-400" : "text-white/50"}`} />
                      <span className="text-white/75">{f}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={() => handleBuy(tier.id)} disabled={buying === tier.id}
                  className={`shine-btn w-full inline-flex items-center justify-center gap-2 font-bold text-sm px-4 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait ${
                    popular ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 ring-1 ring-white/20" : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
                  }`}
                >
                  {buying === tier.id ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo...</> : <><ShoppingCart className="w-4 h-4" /> {tier.cta}</>}
                </button>

                {/* Botón PayPal — solo para pagos únicos (no suscripciones) */}
                {tier.billingPeriod === "lifetime" && (
                  <button onClick={() => handleBuy(tier.id)} disabled={buying === tier.id}
                    className="w-full inline-flex items-center justify-center gap-2 font-bold text-sm px-4 py-3 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait bg-[#FFC439] hover:bg-[#f0b429] text-[#003087] mt-2"
                  >
                    {buying === tier.id ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo...</> : (
                      <svg viewBox="0 0 101 32" className="h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.237 2.707H5.5a.893.893 0 00-.883.756L2.05 19.532a.536.536 0 00.53.619h3.37l.847-5.375-.027.17a.893.893 0 01.882-.756h1.837c3.608 0 6.432-1.466 7.254-5.706.025-.124.046-.245.065-.363-.104-.055-.104-.055 0 0 .244-1.557-.002-2.616-.84-3.574-.925-1.053-2.597-1.84-4.731-1.84z" fill="#003087"/>
                        <path d="M35.443 2.707h-6.737a.893.893 0 00-.883.756L25.256 19.532a.536.536 0 00.53.619h3.221a.625.625 0 00.618-.528l.877-5.566a.893.893 0 01.882-.756h2.132c4.469 0 7.048-2.162 7.724-6.447.309-1.875.013-3.347-.886-4.38-.986-1.131-2.732-1.767-4.911-1.767z" fill="#003087"/>
                        <path d="M49.952 10.662c-.292 1.916-1.759 1.916-3.177 1.916h-.806l.566-3.583a.536.536 0 01.53-.453h.37c.965 0 1.876 0 2.346.55.281.328.366.814.171 1.57zM49.34 6.93h-5.35a.893.893 0 00-.882.756L40.54 23.755a.536.536 0 00.529.619h2.554a.625.625 0 00.617-.528l.601-3.808a.893.893 0 01.882-.756h1.69c3.517 0 5.543-1.7 6.073-5.074.238-1.476.01-2.636-.68-3.448-.754-.888-2.091-1.83-3.466-1.83z" fill="#009cde"/>
                        <path d="M64.1 16.715a3.017 3.017 0 01-3.053 2.581c-.785 0-1.413-.252-1.814-.728-.399-.473-.549-1.147-.422-1.897a3.03 3.03 0 013.036-2.596c.769 0 1.392.254 1.8.734.41.483.571 1.16.453 1.906zm3.758-5.784h-2.56a.536.536 0 00-.53.453l-.135.862-.216-.313c-.669-.97-2.16-1.295-3.649-1.295-3.414 0-6.33 2.587-6.896 6.214-.295 1.811.124 3.54 1.149 4.746 1.941 2.237 5.254 2.1 5.254 2.1.941 0 1.892-.21 2.694-.602l-.135.838a.536.536 0 00.53.619h2.305a.893.893 0 00.882-.756l1.384-8.77a.536.536 0 00-.077-.096z" fill="#009cde"/>
                        <path d="M80.973 10.931h-2.574a.893.893 0 00-.737.39l-4.253 6.259-1.803-6.015a.893.893 0 00-.857-.634h-2.528a.536.536 0 00-.509.709l3.396 9.971-3.195 4.509a.536.536 0 00.438.847h2.572a.893.893 0 00.733-.385l10.263-14.81a.536.536 0 00-.447-.841z" fill="#003087"/>
                        <path d="M88.455 16.715a3.017 3.017 0 01-3.053 2.581c-.785 0-1.413-.252-1.814-.728-.399-.473-.549-1.147-.422-1.897a3.03 3.03 0 013.036-2.596c.769 0 1.392.254 1.8.734.41.483.571 1.16.453 1.906zm3.758-5.784h-2.56a.536.536 0 00-.53.453l-.135.862-.215-.313c-.669-.97-2.16-1.295-3.65-1.295-3.413 0-6.329 2.587-6.896 6.214-.295 1.811.125 3.54 1.15 4.746 1.94 2.237 5.254 2.1 5.254 2.1.941 0 1.892-.21 2.694-.602l-.135.838a.536.536 0 00.53.619h2.305a.893.893 0 00.882-.756l1.384-8.77a.536.536 0 00-.077-.096z" fill="#009cde"/>
                        <path d="M97.336 3.223l-2.633 16.751a.536.536 0 00.53.619h2.206a.893.893 0 00.882-.756l2.596-16.453a.536.536 0 00-.53-.619h-2.521a.536.536 0 00-.53.458z" fill="#009cde"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Trust strip */}
        <div className="glass-card rounded-2xl border border-white/10 p-5 mt-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div><Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-1" /><p className="text-white text-xs font-bold">Garantía 30 días</p></div>
            <div><Zap className="w-6 h-6 text-cyan-400 mx-auto mb-1" /><p className="text-white text-xs font-bold">Activación inmediata</p></div>
            <div><Crown className="w-6 h-6 text-fuchsia-400 mx-auto mb-1" /><p className="text-white text-xs font-bold">Soporte 24/7</p></div>
            <div><Shield className="w-6 h-6 text-green-400 mx-auto mb-1" /><p className="text-white text-xs font-bold">Pago seguro Stripe</p></div>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            PREGUNTAS{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">FRECUENTES</span>
          </h2>
          <p className="text-white/50 text-base mt-3 max-w-xl mx-auto">
            Respondemos las dudas más comunes antes de que las tengas.
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className={`glass-card rounded-2xl border transition-all duration-200 overflow-hidden ${openFaq === i ? "border-cyan-500/30" : "border-white/10"}`}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <span className="text-white font-bold text-sm">{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-cyan-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-white/60 text-sm leading-relaxed border-t border-white/8 pt-4">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ CONTACT ═══════════ */}
      <section id="contacto" className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-5">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            ¿TIENES <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">DUDAS?</span>
          </h2>
          <p className="text-white/50 text-base">Nuestro equipo de soporte está listo para ayudarte a llevar tu contenido al siguiente nivel.</p>
          <div className="glass-card p-6 rounded-2xl border-white/10">
            <div className="w-11 h-11 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4"><Mail className="w-5 h-5 text-cyan-400" /></div>
            <h3 className="text-white font-bold mb-1">Soporte Técnico</h3>
            <p className="text-white/50 text-sm mb-2">¿Problemas con la instalación o uso? Estamos aquí para ayudarte.</p>
            <a href="mailto:soporte@mediaplaypromo.com" className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold">soporte@mediaplaypromo.com</a>
          </div>
          <div className="glass-card p-6 rounded-2xl border-white/10">
            <div className="w-11 h-11 rounded-full bg-fuchsia-500/10 flex items-center justify-center mb-4"><Zap className="w-5 h-5 text-fuchsia-400" /></div>
            <h3 className="text-white font-bold mb-1">Ventas y Agencias</h3>
            <p className="text-white/50 text-sm mb-2">¿Necesitas un plan personalizado para tu equipo?</p>
            <a href="mailto:ventas@mediaplaypromo.com" className="text-fuchsia-400 hover:text-fuchsia-300 text-sm font-semibold">ventas@mediaplaypromo.com</a>
          </div>
        </div>

        <form onSubmit={handleContact} className="glass-card p-7 rounded-3xl border-cyan-500/20">
          <h3 className="text-xl font-bold text-white mb-5">Envíanos un mensaje</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-white/55 text-xs font-bold uppercase tracking-wider mb-1.5">Nombre</label>
              <input required value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })}
                placeholder="Tu nombre"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40" />
            </div>
            <div>
              <label className="block text-white/55 text-xs font-bold uppercase tracking-wider mb-1.5">Email</label>
              <input required type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })}
                placeholder="tu@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40" />
            </div>
            <div>
              <label className="block text-white/55 text-xs font-bold uppercase tracking-wider mb-1.5">Mensaje</label>
              <textarea required rows={4} value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })}
                placeholder="¿En qué podemos ayudarte?"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 resize-none" />
            </div>
            <button type="submit"
              className="shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-cyan-500/30">
              ENVIAR MENSAJE <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="text-center">
        <div className="glass-card rounded-3xl p-10 sm:p-12 max-w-4xl mx-auto border-cyan-500/30 shadow-2xl shadow-cyan-500/10 relative overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="relative text-3xl sm:text-5xl font-black text-white mb-5">
            ¿LISTO PARA <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-pink-400">DOMINAR</span> TU CONTENIDO?
          </h2>
          <p className="relative text-white/55 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            Únete a miles de creadores que ya están automatizando su flujo de trabajo y multiplicando sus resultados.
          </p>
          <button onClick={() => scrollTo("precios")}
            className="relative shine-btn inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black h-16 px-10 rounded-full shadow-2xl shadow-cyan-500/30 ring-1 ring-white/20 text-lg transition-all hover:-translate-y-0.5">
            OBTENER {product.shortName ?? product.name} AHORA <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ── Modal de pago embebido (sin salir de la web) ── */}
      {checkoutSecret && (
        <EmbeddedCheckoutModal clientSecret={checkoutSecret} onClose={() => setCheckoutSecret(null)} />
      )}

      {/* ── Modal Login (usuario anónimo pulsa Comprar) ── */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowLoginPrompt(null)}>
          <div onClick={(e) => e.stopPropagation()} className="glass-card relative max-w-md w-full rounded-3xl border-2 border-cyan-500/40 p-7 shadow-2xl shadow-cyan-500/30">
            <div className="text-center">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 items-center justify-center shadow-2xl mb-4 ring-2 ring-white/20">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">¡Casi lo tienes!</h3>
              <p className="text-white/55 text-sm mb-5">Para comprar <strong className="text-cyan-400">{product.name}</strong> necesitas una cuenta. Es gratis y tarda menos de 1 minuto.</p>
              <div className="space-y-2">
                <button onClick={() => router.push(`/login?redirect=${encodeURIComponent(`${pathname}?buy=${showLoginPrompt}`)}`)}
                  className="shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg ring-1 ring-white/20">
                  <LogIn className="w-4 h-4" /> Iniciar sesión y comprar
                </button>
                <button onClick={() => router.push(`/register?redirect=${encodeURIComponent(`${pathname}?buy=${showLoginPrompt}`)}`)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all">
                  Crear cuenta gratis <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => setShowLoginPrompt(null)} className="w-full text-white/40 hover:text-white text-xs py-2 transition-colors">Seguir explorando</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Banner de cupón con contador de 48h (urgencia visual; se reinicia por visitante) */
function CouponBanner({ code, percent, slug }: { code: string; percent: number; slug: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const key = `mpp_offer_deadline_${slug}`;
    let dl = 0;
    try { dl = Number(localStorage.getItem(key) || 0); } catch {}
    const now = Date.now();
    if (!dl || dl < now) {
      dl = now + 48 * 3600 * 1000;
      try { localStorage.setItem(key, String(dl)); } catch {}
    }
    const tick = () => {
      let r = dl - Date.now();
      if (r <= 0) {
        dl = Date.now() + 48 * 3600 * 1000;
        try { localStorage.setItem(key, String(dl)); } catch {}
        r = dl - Date.now();
      }
      setRemaining(r);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [slug]);

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  return (
    <div className="max-w-4xl mx-auto mb-8 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-orange-500/[0.07] to-transparent p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm sm:text-base leading-tight">
              {percent}% DE DESCUENTO con el código{" "}
              <button onClick={copy} className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-mono tracking-wider">
                {code} {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 opacity-70" />}
              </button>
            </p>
            <p className="text-white/50 text-xs mt-0.5">Aplícalo al pagar. Oferta de lanzamiento por tiempo limitado.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/30 border border-amber-500/30 rounded-xl px-3 py-2 flex-shrink-0">
          <Clock className="w-4 h-4 text-amber-400" />
          <div className="text-left">
            <p className="text-amber-300/70 text-[9px] font-bold uppercase tracking-wider leading-none">Termina en</p>
            <p className="text-white font-mono font-black text-lg leading-tight tabular-nums">{remaining === null ? "48:00:00" : fmt(remaining)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Insignia circular del monograma YF (Y dorada + F azul, estilo del logo) */
function YFBadge() {
  return (
    <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-[#1a1f3a] to-[#070a16] border-2 border-white/10 flex items-center justify-center shadow-2xl">
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500/25 via-transparent to-fuchsia-500/25" />
      <div className="absolute inset-2 rounded-full border border-white/5" />
      <span className="relative text-6xl font-black tracking-tighter drop-shadow-lg">
        <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-orange-500">Y</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-fuchsia-500">F</span>
      </span>
    </div>
  );
}

/** Maqueta 3D vectorial de la caja del producto (cuando no hay imagen subida) */
function ProductBoxMock({ product }: { product: Product }) {
  const tools = (product.subProducts?.slice(0, 3).map((s) => s.name)) ?? ["AUDIO REPLACE", "CLIP CUTTER", "FORMAT CONVERTER"];
  const extra = (product.subProducts?.length ?? 0) - 3;
  return (
    <div className="relative mx-auto w-full max-w-[20rem] float-soft" style={{ perspective: "1100px" }}>
      <div className="absolute -inset-6 bg-gradient-to-tr from-cyan-500/25 via-fuchsia-500/20 to-orange-500/20 rounded-[2rem] blur-3xl pointer-events-none" />
      <div
        className="relative rounded-[1.5rem] border border-white/15 bg-gradient-to-br from-[#0c1124] via-[#0a0c1a] to-[#05060d] shadow-2xl overflow-hidden p-6 flex flex-col aspect-[4/5]"
        style={{ transform: "rotateY(-7deg) rotateX(3deg)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <p className="relative text-center text-white/70 text-[11px] font-bold tracking-[0.35em] uppercase">YF AUTO CLIP</p>

        <div className="relative flex-1 flex items-center justify-center py-4">
          <YFBadge />
        </div>

        <div className="relative space-y-2">
          {tools.map((t) => (
            <div key={t} className="rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-center py-2 text-[11px] font-black tracking-widest text-black/90 shadow-lg shadow-orange-500/20">
              {t}
            </div>
          ))}
          {extra > 0 && <p className="text-center text-cyan-300 text-[10px] font-bold pt-1">+{extra} herramientas más</p>}
        </div>

        <p className="relative text-center text-white/40 text-[9px] mt-3 leading-tight">
          {product.packTagline ?? "Procesamiento masivo de video"}
          {product.author ? ` · ${product.author}` : ""}{product.version ? ` · ${product.version}` : ""}
        </p>
      </div>

      <div className="absolute -top-4 -right-3 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 flex items-center justify-center shadow-xl ring-2 ring-white/30 float-soft">
        <Sparkles className="w-7 h-7 text-white drop-shadow" />
      </div>
    </div>
  );
}
