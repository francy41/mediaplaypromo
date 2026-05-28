"use client";
import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, Sparkles, Play, Star, Clock,
  Users, ArrowUpRight, Check, Lock, Zap, Shield, Globe, BarChart3
} from "lucide-react";
import { CATEGORIES, getCategoryBySlug } from "@/lib/categories";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const testimonials = [
  { name: "Carlos M.",  text: "Increíble, ahorré 20 horas a la semana.", stars: 5 },
  { name: "Ana R.",     text: "La mejor herramienta que he probado en años.", stars: 5 },
  { name: "Luis G.",    text: "Resultados profesionales desde el primer día.", stars: 5 },
];

const editorVideoWhy = [
  { icon: Zap, title: "Ahorra Tiempo", desc: "Automatiza procesos que antes tomaban horas.", color: "text-yellow-400" },
  { icon: BarChart3, title: "Aumenta Productividad", desc: "Flujos de trabajo más rápidos y eficientes.", color: "text-cyan-400" },
  { icon: Star, title: "Resultados Profesionales", desc: "Calidad de estudio en cada operación.", color: "text-purple-400" },
  { icon: Shield, title: "Contenido Visual", desc: "Mejora tu presencia visual en todas las plataformas.", color: "text-green-400" },
  { icon: Globe, title: "100% Seguro", desc: "Privacidad garantizada en todos tus archivos.", color: "text-blue-400" },
  { icon: Users, title: "Fácil de Usar", desc: "Interfaz intuitiva para cualquier nivel.", color: "text-orange-400" },
];

const editorVideoSteps = [
  { n: "1", title: "Sube tu Video", desc: "Arrastra o selecciona tu archivo de video." },
  { n: "2", title: "Consulta el Panel", desc: "Elige la herramienta y configura opciones." },
  { n: "3", title: "Automatiza el Proceso", desc: "El sistema procesa todo automáticamente." },
  { n: "4", title: "Exporta y Publica", desc: "Descarga el resultado y publícalo directo." },
];

export default function CategoryPage({ params }: PageProps) {
  const { slug } = use(params);
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  const Icon = cat.icon;

  const relatedCategories = CATEGORIES
    .filter(c => c.slug !== slug && c.enabled)
    .slice(0, 4);

  return (
    <div className="space-y-8 pb-8">

      {/* ── Hero ── */}
      <div className={`relative overflow-hidden rounded-2xl border ${cat.borderColor} bg-gradient-to-br ${cat.bgCard} p-8`}>
        <div className={`absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br ${cat.gradient} opacity-10 rounded-full blur-3xl`} />
        <div className={`absolute -bottom-20 -left-10 w-60 h-60 bg-gradient-to-br ${cat.gradient} opacity-8 rounded-full blur-3xl`} />

        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-lg ${cat.glowColor}`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  {cat.premium && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full mb-1">
                      <Star className="w-2.5 h-2.5" /> PRO
                    </span>
                  )}
                  <h1 className="text-white font-black text-3xl leading-none">{cat.title}</h1>
                </div>
              </div>
              <p className="text-white/55 text-base max-w-xl">{cat.subtitle}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {cat.tags.map(tag => (
                  <span key={tag} className={`bg-white/10 ${cat.textAccent} text-xs px-2.5 py-1 rounded-full border ${cat.borderColor}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className={`flex items-center gap-2 bg-gradient-to-r ${cat.gradient} text-white font-bold px-6 py-3 rounded-xl transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-lg ${cat.glowColor}`}>
                <Zap className="w-4 h-4" /> Usar Ahora
              </button>
              <button className="flex items-center gap-2 bg-white/10 border border-white/15 hover:bg-white/15 text-white font-medium px-5 py-3 rounded-xl transition-all text-sm">
                <Play className="w-4 h-4" /> Ver Demo
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-6 mt-6 flex-wrap">
            {[
              { icon: Users, label: "12,450+ usuarios activos" },
              { icon: Star,  label: "4.9/5 valoración media" },
              { icon: Clock, label: "Actualizado esta semana" },
            ].map((s) => {
              const SIcon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-2 text-white/50 text-xs">
                  <SIcon className={`w-3.5 h-3.5 ${cat.textAccent}`} />
                  {s.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tools Grid ── */}
      <div>
        <h2 className="text-white font-bold text-lg mb-4">
          Herramientas disponibles
          <span className="ml-2 text-sm font-normal text-white/35">({cat.tools.length} módulos)</span>
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {cat.tools.map((tool) => (
            <div
              key={tool.id}
              className={`group relative bg-[#0f1219] border ${tool.comingSoon ? "border-white/5 opacity-60" : `border-white/8 hover:${cat.borderColor} hover:border-opacity-100`} rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5`}
            >
              {tool.badge && !tool.comingSoon && (
                <span className={`absolute top-4 right-4 ${tool.badgeColor} text-white text-[9px] font-bold px-2 py-0.5 rounded-full`}>
                  {tool.badge}
                </span>
              )}
              {tool.comingSoon && (
                <span className="absolute top-4 right-4 bg-white/10 text-white/40 text-[9px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Próximo
                </span>
              )}

              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center mb-4 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all`}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              <h3 className="text-white font-semibold text-sm mb-1.5">{tool.title}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{tool.description}</p>

              {!tool.comingSoon && (
                <button className={`mt-4 flex items-center gap-1 ${cat.textAccent} text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Abrir herramienta <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Editor de Video: Why + How (solo en editor-video) ── */}
      {slug === "editor-video" && (
        <>
          <div>
            <div className="text-center mb-6">
              <h2 className="text-white font-bold text-2xl sm:text-3xl">
                POR QUÉ ELEGIR <span className={cat.textAccent}>EDITOR DE VIDEO</span>
              </h2>
              <p className="text-white/40 text-sm mt-2 max-w-xl mx-auto">
                Diseñado para creadores que valoran su tiempo y buscan resultados profesionales sin complicaciones.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {editorVideoWhy.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <div key={item.title} className="bg-[#0f1219] border border-white/8 rounded-xl p-5 hover:bg-white/5 transition-colors">
                    <ItemIcon className={`w-6 h-6 ${item.color} mb-3`} />
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-white/40 text-sm">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-center mb-6">
              <h2 className="text-white font-bold text-2xl sm:text-3xl">¿CÓMO FUNCIONA?</h2>
              <p className="text-white/40 text-sm mt-2 max-w-xl mx-auto">
                Un flujo de trabajo optimizado para que pases menos tiempo editando y más tiempo creando.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {editorVideoSteps.map((step) => (
                <div key={step.n} className="text-center">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${cat.gradient} flex items-center justify-center font-black text-white text-lg mx-auto mb-3 shadow-lg ${cat.glowColor}`}>
                    {step.n}
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{step.title}</h3>
                  <p className="text-white/40 text-xs">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Features + Testimonials ── */}
      <div className="grid grid-cols-2 gap-5">
        {/* Features */}
        <div className="bg-[#0f1219] border border-white/8 rounded-2xl p-6">
          <h3 className="text-white font-bold text-base mb-4">¿Por qué usar {cat.title}?</h3>
          <div className="space-y-3">
            {[
              "Integración completa con tu flujo de trabajo",
              "Resultados profesionales en minutos",
              "Soporte técnico prioritario 24/7",
              "Actualizaciones automáticas incluidas",
              "API disponible para integraciones externas",
              "Exportación en múltiples formatos",
            ].map((f) => (
              <div key={f} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${cat.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-white/65 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-[#0f1219] border border-white/8 rounded-2xl p-6">
          <h3 className="text-white font-bold text-base mb-4">Lo que dicen nuestros usuarios</h3>
          <div className="space-y-4">
            {testimonials.map((t) => (
              <div key={t.name} className={`p-4 bg-gradient-to-br ${cat.bgCard} border ${cat.borderColor} rounded-xl`}>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/70 text-xs italic mb-2">"{t.text}"</p>
                <p className={`text-xs font-semibold ${cat.textAccent}`}>— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Related Categories ── */}
      <div>
        <h3 className="text-white font-bold text-base mb-4">También te puede interesar</h3>
        <div className="grid grid-cols-4 gap-3">
          {relatedCategories.map((related) => {
            const RelIcon = related.icon;
            return (
              <Link key={related.slug} href={`/categories/${related.slug}`}>
                <div className={`bg-[#0f1219] border ${related.borderColor} rounded-xl p-4 hover:border-white/20 hover:-translate-y-0.5 transition-all group`}>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${related.gradient} flex items-center justify-center mb-3`}>
                    <RelIcon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-white font-medium text-sm leading-snug">{related.title}</p>
                  <p className={`text-xs ${related.textAccent} mt-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Ver más <ChevronRight className="w-3 h-3" />
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}
