import type { User, Product, ActivityItem, ChartDataPoint, Invoice, SupportTicket, MarketplaceListing } from "@/types";

export const mockUser: User = {
  id: "usr_1",
  name: "Solfa Mendez",
  email: "solfa@mediaplaypromo.com",
  avatar: undefined,
  role: "user",
  plan: "free",
  planStatus: "active",
  createdAt: "2025-01-15",
};

export const mockProducts: Product[] = [
  {
    id: "prod_1",
    name: "YF Auto Clip",
    description: "Suite completa de herramientas para creadores de contenido",
    version: "2.1.0",
    category: "suite",
    icon: "YF",
    color: "from-cyan-500 to-blue-600",
    features: ["Audio Replace", "Clip Cutter", "Format Converter"],
    updatedAt: "2025-06-20",
  },
  {
    id: "prod_2",
    name: "AI Ads Creator",
    description: "Genera anuncios publicitarios con inteligencia artificial",
    version: "1.4.2",
    category: "ai",
    icon: "AI",
    color: "from-purple-500 to-pink-600",
    features: ["Ad Copy AI", "Image Generator", "A/B Testing"],
    updatedAt: "2025-06-18",
  },
  {
    id: "prod_3",
    name: "Social Booster",
    description: "Automatiza tu presencia en redes sociales",
    version: "3.0.1",
    category: "social",
    icon: "SB",
    color: "from-green-500 to-teal-600",
    features: ["Auto Post", "Analytics", "Scheduler"],
    updatedAt: "2025-06-15",
  },
];

export const mockActivity: ActivityItem[] = [
  {
    id: "act_1",
    type: "download",
    title: "Descargaste YF Auto Clip - v2.1.0",
    subtitle: "Hoy, 10:45 AM",
    date: "2025-06-27T10:45:00",
    icon: "download",
    color: "text-green-400",
  },
  {
    id: "act_2",
    type: "invoice",
    title: "Factura #INV-2025-0012 generada",
    subtitle: "Ayer, 04:20 PM",
    date: "2025-06-26T16:20:00",
    icon: "file-text",
    color: "text-purple-400",
  },
  {
    id: "act_3",
    type: "purchase",
    title: "Compra realizada - Plan Pro Anual",
    subtitle: "12 Jun 2025",
    date: "2025-06-12T09:00:00",
    icon: "shopping-cart",
    color: "text-blue-400",
  },
  {
    id: "act_4",
    type: "support",
    title: "Ticket #TKT-2025-0042 respondido",
    subtitle: "10 Jun 2025",
    date: "2025-06-10T14:30:00",
    icon: "message-square",
    color: "text-orange-400",
  },
  {
    id: "act_5",
    type: "plan",
    title: "Plan actualizado a Pro",
    subtitle: "08 Jun 2025",
    date: "2025-06-08T11:00:00",
    icon: "shield",
    color: "text-red-400",
  },
];

export const mockChartData: ChartDataPoint[] = [
  { date: "1 Jun", value: 14 },
  { date: "5 Jun", value: 22 },
  { date: "10 Jun", value: 18 },
  { date: "15 Jun", value: 38 },
  { date: "20 Jun", value: 32 },
  { date: "25 Jun", value: 42 },
  { date: "30 Jun", value: 35 },
];

export const mockInvoices: Invoice[] = [
  { id: "inv_1", number: "INV-2025-0012", amount: 0, status: "paid", date: "2025-06-26", dueDate: "2025-07-15" },
  { id: "inv_2", number: "INV-2025-0011", amount: 99, status: "paid", date: "2025-06-12", dueDate: "2025-06-12" },
  { id: "inv_3", number: "INV-2025-0010", amount: 99, status: "paid", date: "2025-05-12", dueDate: "2025-05-12" },
];

export const mockTickets: SupportTicket[] = [
  { id: "tkt_1", number: "TKT-2025-0042", subject: "Error al descargar YF Auto Clip", status: "resolved", priority: "medium", createdAt: "2025-06-08", updatedAt: "2025-06-10" },
  { id: "tkt_2", number: "TKT-2025-0038", subject: "Problema con facturación", status: "closed", priority: "high", createdAt: "2025-05-20", updatedAt: "2025-05-22" },
];

export const mockListings: MarketplaceListing[] = [
  {
    id: "lst_1",
    title: "Crearé reels virales para tu marca",
    description: "Edición profesional de reels con música trending y efectos premium",
    price: 49,
    category: "video",
    seller: { id: "u2", name: "Carlos Reels", avatar: undefined },
    rating: 4.9,
    reviewCount: 128,
    deliveryDays: 3,
    tags: ["reels", "instagram", "tiktok"],
  },
  {
    id: "lst_2",
    title: "Diseñaré tu identidad de marca completa",
    description: "Logo, paleta de colores, tipografía y manual de marca",
    price: 120,
    category: "design",
    seller: { id: "u3", name: "Ana Design", avatar: undefined },
    rating: 4.8,
    reviewCount: 89,
    deliveryDays: 5,
    tags: ["branding", "logo", "identidad"],
  },
  {
    id: "lst_3",
    title: "Gestión de redes sociales — 1 mes",
    description: "30 posts, historias diarias, engagement y reportes semanales",
    price: 299,
    category: "social",
    seller: { id: "u4", name: "Social Pro", avatar: undefined },
    rating: 4.7,
    reviewCount: 203,
    deliveryDays: 30,
    tags: ["social media", "community", "engagement"],
  },
  {
    id: "lst_4",
    title: "Campañas de ads en Meta e Instagram",
    description: "Configuración, optimización y seguimiento de campañas publicitarias",
    price: 199,
    category: "ads",
    seller: { id: "u5", name: "Ads Master", avatar: undefined },
    rating: 4.6,
    reviewCount: 67,
    deliveryDays: 7,
    tags: ["meta ads", "facebook", "instagram ads"],
  },
];
