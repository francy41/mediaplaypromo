/**
 * Generador de captions por PLANTILLAS (cliente, instantáneo, sin IA ni costo).
 * Combina piezas al azar y se adapta al "brief" del proyecto (nicho/producto).
 * Genérico: sirve para cualquier cuenta (tienda, baile, servicios…).
 *
 * No importar "server-only": este módulo se usa en el navegador.
 */

export interface CaptionInput {
  brief: string; // descripción libre del nicho/producto, ej: "zapatillas Nike originales, envíos, afiliados"
  brand?: string; // nombre de marca/cuenta
  link?: string; // link de venta/CTA
  platform?: string; // instagram | tiktok | youtube | facebook | linkedin
}

export interface CaptionResult {
  caption: string;
  hashtags: string[];
}

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const sample = <T,>(a: T[], n: number): T[] => {
  const c = [...a];
  const out: T[] = [];
  while (c.length && out.length < n) out.push(c.splice(Math.floor(Math.random() * c.length), 1)[0]);
  return out;
};

const HOOKS = [
  "🔥 Esto es justo lo que estabas buscando 👇",
  "✨ No te lo pierdas 👇",
  "👀 Mira esto antes de que se acabe",
  "🚀 Lo nuevo que todos están pidiendo",
  "💥 Toma nota, esto te interesa",
  "⭐ Calidad que se nota desde el primer día",
];

const BENEFITS = [
  "✅ Calidad garantizada",
  "✅ Los mejores precios",
  "✅ Envíos rápidos y seguros 📦",
  "✅ Atención personalizada",
  "✅ Novedades cada semana",
  "✅ Pago 100% seguro 🔒",
  "✅ Satisfacción garantizada",
];

const CTAS = [
  "🛒 Compra ahora 👇",
  "👉 Aprovéchalo aquí 👇",
  "📲 Escríbenos o compra aquí 👇",
  "🔗 Todo en el enlace 👇",
];

const CLOSERS = [
  "¿Cuál es tu favorito? Cuéntame en comentarios 💬",
  "Guárdalo para no perderlo 📌",
  "Etiqueta a quien le encantaría esto 👇",
  "Compártelo con alguien que lo necesita 🤝",
];

// Hashtags amplios de respaldo (siempre útiles en redes).
const BROAD = [
  "#viral", "#reels", "#parati", "#fyp", "#tendencia",
  "#oferta", "#novedad", "#calidad", "#emprender", "#negocio",
];

const STOPWORDS = new Set([
  "de", "la", "el", "los", "las", "un", "una", "unos", "unas", "y", "o", "con",
  "para", "por", "en", "del", "al", "a", "que", "the", "and", "of", "to",
  "originales", "original", "nuevo", "nuevos", "mejor", "mejores",
  "todo", "toda", "todos", "todas", "cada", "mas", "muy", "tu", "tus", "mi", "mis",
  "es", "son", "este", "esta", "estos", "estas", "sin", "como",
]);

/** Convierte una palabra en hashtag limpio (sin acentos ni símbolos). */
function toHashtag(word: string): string {
  const clean = word
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .replace(/[^a-zA-Z0-9]/g, "");
  return clean ? `#${clean.toLowerCase()}` : "";
}

/** Extrae hashtags relevantes del brief (palabras clave del nicho). */
function hashtagsFromBrief(brief: string): string[] {
  const words = brief
    .split(/[\s,;.]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOPWORDS.has(w.toLowerCase()));
  const tags = words.map(toHashtag).filter(Boolean);
  return Array.from(new Set(tags)); // sin duplicados
}

// Cuántos hashtags según la plataforma.
function hashtagCount(platform?: string): number {
  switch ((platform || "").toLowerCase()) {
    case "instagram": return 15;
    case "tiktok": return 8;
    case "youtube": return 8;
    case "linkedin": return 5;
    case "facebook": return 6;
    default: return 12;
  }
}

/** Genera un caption + hashtags a partir del brief del proyecto. */
export function generateCaptionTemplate(input: CaptionInput): CaptionResult {
  const brand = (input.brand || "").trim();
  const brief = (input.brief || "").trim();
  const link = (input.link || "").trim();

  const niche = brief || "lo mejor para ti";
  const pitch = brand
    ? `En ${brand} tienes ${niche} al mejor precio 💸`
    : `Descubre ${niche} al mejor precio 💸`;

  const lines = [
    pick(HOOKS),
    "",
    pitch,
    "",
    ...sample(BENEFITS, 4),
    "",
    pick(CTAS),
    ...(link ? [link] : []),
    "",
    pick(CLOSERS),
  ];

  const nicheTags = hashtagsFromBrief(brief);
  const count = hashtagCount(input.platform);
  const needed = Math.max(0, count - nicheTags.length);
  const hashtags = [...nicheTags, ...sample(BROAD, needed)].slice(0, count);

  return { caption: lines.join("\n"), hashtags };
}

/** Une caption + hashtags en un solo texto listo para publicar. */
export function composeCaption(result: CaptionResult): string {
  return result.hashtags.length
    ? `${result.caption}\n\n${result.hashtags.join(" ")}`
    : result.caption;
}
