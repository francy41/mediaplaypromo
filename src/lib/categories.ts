import {
  Video, Film, Zap, Mic, Image, BookOpen,
  ShoppingBag, Layout, Users, Globe
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface CategoryTool {
  id: string;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  comingSoon?: boolean;
}

export interface Category {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  glowColor: string;
  borderColor: string;
  textAccent: string;
  bgCard: string;
  enabled: boolean;
  showSidebar: boolean;
  showHomepage: boolean;
  premium: boolean;
  order: number;
  tools: CategoryTool[];
  tags: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "cat_1",
    slug: "generador-video",
    title: "Generador de Video",
    subtitle: "Crea videos profesionales con IA en segundos",
    icon: Video,
    gradient: "from-pink-500 via-rose-500 to-red-600",
    glowColor: "shadow-pink-500/25",
    borderColor: "border-pink-500/20",
    textAccent: "text-pink-400",
    bgCard: "from-pink-500/10 to-rose-500/5",
    enabled: true,
    showSidebar: true,
    showHomepage: true,
    premium: false,
    order: 1,
    tags: ["IA", "Video", "Texto a Video"],
    tools: [
      { id: "t1", title: "Texto a Video", description: "Convierte cualquier texto en video animado con IA", badge: "Nuevo", badgeColor: "bg-pink-500" },
      { id: "t2", title: "Imagen a Video", description: "Anima tus imágenes estáticas con movimiento realista", badge: "Popular", badgeColor: "bg-rose-500" },
      { id: "t3", title: "Plantillas de Video", description: "150+ plantillas premium para redes sociales" },
      { id: "t4", title: "Avatar IA", description: "Genera presentadores virtuales para tus videos", comingSoon: true },
      { id: "t5", title: "Exportación HD", description: "Exporta en 4K, 1080p para cualquier plataforma" },
      { id: "t6", title: "Subtítulos Auto", description: "Añade subtítulos automáticos en 20+ idiomas" },
    ],
  },
  {
    id: "cat_2",
    slug: "editor-video",
    title: "Editor de Video",
    subtitle: "Edición profesional con inteligencia artificial",
    icon: Film,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    glowColor: "shadow-violet-500/25",
    borderColor: "border-violet-500/20",
    textAccent: "text-violet-400",
    bgCard: "from-violet-500/10 to-purple-500/5",
    enabled: true,
    showSidebar: true,
    showHomepage: true,
    premium: false,
    order: 2,
    tags: ["Edición", "Timeline", "Efectos"],
    tools: [
      { id: "t1", title: "Editor de Línea de Tiempo", description: "Drag & drop profesional con capas múltiples", badge: "Pro", badgeColor: "bg-violet-500" },
      { id: "t2", title: "Transiciones IA", description: "500+ transiciones generadas con inteligencia artificial" },
      { id: "t3", title: "Subtítulos Animados", description: "Añade subtítulos con estilos y animaciones premium" },
      { id: "t4", title: "Efectos Visuales", description: "Filtros, overlays y efectos cinematográficos" },
      { id: "t5", title: "Corrección de Color", description: "LUTs profesionales y corrección automática" },
      { id: "t6", title: "Exportación Multi-plataforma", description: "TikTok, Reels, YouTube, LinkedIn optimizados" },
    ],
  },
  {
    id: "cat_3",
    slug: "automatizaciones",
    title: "Automatizaciones",
    subtitle: "Flujos de trabajo inteligentes que trabajan por ti",
    icon: Zap,
    gradient: "from-yellow-400 via-orange-500 to-amber-600",
    glowColor: "shadow-yellow-500/25",
    borderColor: "border-yellow-500/20",
    textAccent: "text-yellow-400",
    bgCard: "from-yellow-500/10 to-orange-500/5",
    enabled: true,
    showSidebar: true,
    showHomepage: true,
    premium: false,
    order: 3,
    tags: ["CRM", "Email", "WhatsApp", "IA"],
    tools: [
      { id: "t1", title: "Constructor de Flujos", description: "Crea automatizaciones visuales sin código", badge: "Nuevo", badgeColor: "bg-yellow-500" },
      { id: "t2", title: "Automatización Email", description: "Secuencias de email con IA y segmentación avanzada" },
      { id: "t3", title: "WhatsApp Bot", description: "Chatbots inteligentes para WhatsApp Business", badge: "Popular", badgeColor: "bg-orange-500" },
      { id: "t4", title: "CRM Automation", description: "Pipeline automático con seguimiento de leads" },
      { id: "t5", title: "Publicación Social", description: "Programa posts en todas tus redes automáticamente" },
      { id: "t6", title: "IA Automation", description: "Automatiza con GPT-4: respuestas, contenido y más" },
    ],
  },
  {
    id: "cat_4",
    slug: "generador-voz",
    title: "Generador de Voz",
    subtitle: "Voces IA ultra-realistas en más de 30 idiomas",
    icon: Mic,
    gradient: "from-cyan-400 via-blue-500 to-indigo-600",
    glowColor: "shadow-cyan-500/25",
    borderColor: "border-cyan-500/20",
    textAccent: "text-cyan-400",
    bgCard: "from-cyan-500/10 to-blue-500/5",
    enabled: true,
    showSidebar: true,
    showHomepage: true,
    premium: false,
    order: 4,
    tags: ["Voz IA", "Multilingüe", "Clonación"],
    tools: [
      { id: "t1", title: "Texto a Voz IA", description: "Convierte texto en voz natural ultra-realista", badge: "Popular", badgeColor: "bg-cyan-500" },
      { id: "t2", title: "Clonación de Voz", description: "Clona cualquier voz con solo 10 segundos de audio", badge: "Pro", badgeColor: "bg-blue-500" },
      { id: "t3", title: "Voces Multilingüe", description: "30+ idiomas y 150+ voces disponibles" },
      { id: "t4", title: "Locución Emocional", description: "Controla emociones: alegría, seriedad, urgencia" },
      { id: "t5", title: "Descarga de Audio", description: "MP3, WAV, FLAC en alta calidad" },
      { id: "t6", title: "API de Voz", description: "Integra la API en tus propias apps", comingSoon: true },
    ],
  },
  {
    id: "cat_5",
    slug: "generador-imagen",
    title: "Generador de Imagen",
    subtitle: "Crea imágenes impresionantes con prompts de texto",
    icon: Image,
    gradient: "from-emerald-400 via-teal-500 to-green-600",
    glowColor: "shadow-emerald-500/25",
    borderColor: "border-emerald-500/20",
    textAccent: "text-emerald-400",
    bgCard: "from-emerald-500/10 to-teal-500/5",
    enabled: true,
    showSidebar: true,
    showHomepage: true,
    premium: false,
    order: 5,
    tags: ["DALL-E", "Stable Diffusion", "Upscale"],
    tools: [
      { id: "t1", title: "Generación por Prompt", description: "DALL-E 3 + Stable Diffusion integrados", badge: "Popular", badgeColor: "bg-emerald-500" },
      { id: "t2", title: "Estilos Artísticos", description: "Realismo, anime, 3D, acuarela, sketch y más" },
      { id: "t3", title: "Upscale 4K", description: "Mejora la resolución hasta 4K con IA" },
      { id: "t4", title: "Eliminar Fondo", description: "Fondo transparente automático con un click" },
      { id: "t5", title: "Editor de Imagen", description: "Inpainting, outpainting y edición por prompt" },
      { id: "t6", title: "Batch Generation", description: "Genera 50+ imágenes en una sola ejecución", badge: "Nuevo", badgeColor: "bg-teal-500" },
    ],
  },
  {
    id: "cat_6",
    slug: "cursos-prompt",
    title: "Cursos de Prompt",
    subtitle: "Domina la ingeniería de prompts para IA",
    icon: BookOpen,
    gradient: "from-blue-400 via-indigo-500 to-purple-600",
    glowColor: "shadow-blue-500/25",
    borderColor: "border-blue-500/20",
    textAccent: "text-blue-400",
    bgCard: "from-blue-500/10 to-indigo-500/5",
    enabled: true,
    showSidebar: true,
    showHomepage: true,
    premium: true,
    order: 6,
    tags: ["Prompts", "ChatGPT", "Academia"],
    tools: [
      { id: "t1", title: "Prompt Engineering Básico", description: "Fundamentos para escribir prompts efectivos", badge: "Gratis", badgeColor: "bg-green-500" },
      { id: "t2", title: "Prompts para Negocios", description: "Automatiza operaciones con prompts avanzados", badge: "Popular", badgeColor: "bg-blue-500" },
      { id: "t3", title: "Prompts para Imágenes", description: "Técnicas maestras para DALL-E y Midjourney" },
      { id: "t4", title: "Prompts para Video", description: "Genera guiones y descripciones de video con IA" },
      { id: "t5", title: "Certificación Prompt", description: "Obtén tu certificado de Prompt Engineer Pro" },
      { id: "t6", title: "Librería de Prompts", description: "500+ prompts listos para usar en tu negocio" },
    ],
  },
  {
    id: "cat_7",
    slug: "venta-cursos",
    title: "Venta de Cursos",
    subtitle: "Tu academia online con pagos y membresías integrados",
    icon: ShoppingBag,
    gradient: "from-orange-400 via-red-500 to-rose-600",
    glowColor: "shadow-orange-500/25",
    borderColor: "border-orange-500/20",
    textAccent: "text-orange-400",
    bgCard: "from-orange-500/10 to-red-500/5",
    enabled: true,
    showSidebar: true,
    showHomepage: true,
    premium: true,
    order: 7,
    tags: ["LMS", "Membresías", "Stripe"],
    tools: [
      { id: "t1", title: "Crear Curso", description: "Constructor de cursos con videos, quizzes y módulos" },
      { id: "t2", title: "Membresías", description: "Plans mensuales/anuales con acceso controlado", badge: "Popular", badgeColor: "bg-orange-500" },
      { id: "t3", title: "Instructor Dashboard", description: "Analytics de ventas, estudiantes y progreso" },
      { id: "t4", title: "Pagos Stripe + PayPal", description: "Cobra en cualquier moneda automáticamente" },
      { id: "t5", title: "Marketplace de Cursos", description: "Publica y vende en el marketplace global" },
      { id: "t6", title: "Certificados Auto", description: "Genera certificados automáticos al completar" },
    ],
  },
  {
    id: "cat_8",
    slug: "venta-paginas",
    title: "Venta de Páginas",
    subtitle: "Templates, funnels y sitios web premium",
    icon: Layout,
    gradient: "from-fuchsia-500 via-pink-500 to-purple-600",
    glowColor: "shadow-fuchsia-500/25",
    borderColor: "border-fuchsia-500/20",
    textAccent: "text-fuchsia-400",
    bgCard: "from-fuchsia-500/10 to-pink-500/5",
    enabled: true,
    showSidebar: true,
    showHomepage: true,
    premium: false,
    order: 8,
    tags: ["Templates", "Funnels", "Landing Pages"],
    tools: [
      { id: "t1", title: "Templates de Landing Page", description: "200+ plantillas de alta conversión", badge: "Popular", badgeColor: "bg-fuchsia-500" },
      { id: "t2", title: "Funnels de Ventas", description: "Embudos completos con upsells y downsells" },
      { id: "t3", title: "Sitios SaaS", description: "Templates completos para productos SaaS" },
      { id: "t4", title: "Ecommerce Templates", description: "Tiendas online listas para vender" },
      { id: "t5", title: "Templates de Agencias", description: "Sitios profesionales para agencias digitales" },
      { id: "t6", title: "Constructor Visual", description: "Edita cualquier template sin código" },
    ],
  },
  {
    id: "cat_9",
    slug: "afiliados",
    title: "Afiliados",
    subtitle: "Genera ingresos recurrentes con comisiones automáticas",
    icon: Users,
    gradient: "from-green-400 via-emerald-500 to-teal-600",
    glowColor: "shadow-green-500/25",
    borderColor: "border-green-500/20",
    textAccent: "text-green-400",
    bgCard: "from-green-500/10 to-emerald-500/5",
    enabled: true,
    showSidebar: true,
    showHomepage: true,
    premium: false,
    order: 9,
    tags: ["Comisiones", "Referidos", "Pagos"],
    tools: [
      { id: "t1", title: "Dashboard de Afiliado", description: "Estadísticas en tiempo real de tus referidos", badge: "Activo", badgeColor: "bg-green-500" },
      { id: "t2", title: "Links de Referido", description: "URLs únicas con tracking de cookies avanzado" },
      { id: "t3", title: "Comisiones Recurrentes", description: "Gana el 30% mensual por cada suscripción activa" },
      { id: "t4", title: "Pagos Automáticos", description: "Cobros via Stripe y PayPal cada mes" },
      { id: "t5", title: "Materiales de Marketing", description: "Banners, emails y copys listos para usar" },
      { id: "t6", title: "Leaderboard", description: "Compite y sube de nivel: Bronze → VIP" },
    ],
  },
  {
    id: "cat_10",
    slug: "marca-blanca",
    title: "Marca Blanca",
    subtitle: "Tu propio SaaS con tu marca y dominio personalizado",
    icon: Globe,
    gradient: "from-slate-400 via-gray-500 to-zinc-600",
    glowColor: "shadow-slate-500/25",
    borderColor: "border-slate-500/20",
    textAccent: "text-slate-300",
    bgCard: "from-slate-500/10 to-gray-500/5",
    enabled: true,
    showSidebar: true,
    showHomepage: true,
    premium: true,
    order: 10,
    tags: ["White Label", "DNS", "SaaS Reseller"],
    tools: [
      { id: "t1", title: "Configurar Dominio", description: "Conecta tu dominio con verificación DNS automática", badge: "Nuevo", badgeColor: "bg-slate-400" },
      { id: "t2", title: "Branding Personalizado", description: "Logo, colores, nombre y favicon propios" },
      { id: "t3", title: "Panel de Clientes", description: "Gestiona tus propios clientes bajo tu marca" },
      { id: "t4", title: "Precios Personalizados", description: "Define tus propios planes y precios de reventa" },
      { id: "t5", title: "SSL Automático", description: "Certificado SSL provisionado automáticamente" },
      { id: "t6", title: "SaaS Reseller", description: "Revende toda la plataforma bajo tu marca", badge: "Enterprise", badgeColor: "bg-purple-500" },
    ],
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
