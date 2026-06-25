import type { LucideIcon } from "lucide-react";
import {
  Sparkles, Brain, Cpu, Mic, Bot, Atom, Languages, MessageSquare, Globe,
  Clapperboard, Aperture, Layers, Flame, Palette, Wand2, Film, Rocket,
  Video, Camera, AudioLines, Radio, Boxes, Workflow, Network,
} from "lucide-react";

/**
 * Catálogo de proveedores conocidos para el hub de Integraciones.
 * Client-safe (sin secretos). El backend usa `id` como `provider` en la tabla
 * `api_integrations` y para saber cómo probar la conexión (ver /api/integrations/test).
 *
 * Añadir un proveedor conocido = una entrada aquí (y opcionalmente su test en
 * el endpoint). Cualquier proveedor no listado se puede añadir igual como "custom".
 */
export type ProviderCategory = "Imagen/Video" | "LLM/Texto" | "Voz/Audio" | "Agregador";

export const CATEGORY_ORDER: ProviderCategory[] = ["Imagen/Video", "LLM/Texto", "Voz/Audio", "Agregador"];

export interface ProviderSpec {
  /** id corto = columna `provider` en BD */
  id: string;
  label: string;
  category: ProviderCategory;
  description: string;
  icon: LucideIcon;
  /** gradiente tailwind para el icono */
  accent: string;
  /** texto de ayuda del campo API key */
  keyPlaceholder: string;
  /** base URL sugerida (editable) */
  defaultBaseUrl?: string;
  docsUrl?: string;
  /** nota extra (ej. proveedores que requieren 2 claves) */
  note?: string;
}

export const PROVIDER_CATALOG: ProviderSpec[] = [
  // ───────────── Imagen / Video ─────────────
  {
    id: "muapi", label: "MUAPI", category: "Imagen/Video",
    description: "Imagen y video: Flux, Veo, Kling, Sora, Wan… (200+ modelos). Proveedor activo de la plataforma.",
    icon: Sparkles, accent: "from-cyan-500 to-blue-600",
    keyPlaceholder: "muapi key…", defaultBaseUrl: "https://api.muapi.ai", docsUrl: "https://api.muapi.ai",
  },
  {
    id: "runway", label: "Runway", category: "Imagen/Video",
    description: "Gen-4 / Gen-3 — generación y edición de video de alta calidad.",
    icon: Clapperboard, accent: "from-rose-500 to-red-600",
    keyPlaceholder: "key_…", defaultBaseUrl: "https://api.dev.runwayml.com", docsUrl: "https://dev.runwayml.com",
    note: "Requiere cabecera de versión (X-Runway-Version).",
  },
  {
    id: "luma", label: "Luma AI", category: "Imagen/Video",
    description: "Dream Machine — video y Photon para imagen.",
    icon: Aperture, accent: "from-indigo-500 to-blue-600",
    keyPlaceholder: "luma-…", defaultBaseUrl: "https://api.lumalabs.ai", docsUrl: "https://lumalabs.ai/api",
  },
  {
    id: "stability", label: "Stability AI", category: "Imagen/Video",
    description: "Stable Diffusion / SD3, imagen y video.",
    icon: Layers, accent: "from-purple-500 to-fuchsia-600",
    keyPlaceholder: "sk-…", defaultBaseUrl: "https://api.stability.ai", docsUrl: "https://platform.stability.ai/account/keys",
  },
  {
    id: "bfl", label: "Black Forest Labs", category: "Imagen/Video",
    description: "Flux 1.1 Pro / Kontext — los modelos Flux originales.",
    icon: Flame, accent: "from-amber-500 to-orange-600",
    keyPlaceholder: "bfl key…", defaultBaseUrl: "https://api.bfl.ai", docsUrl: "https://docs.bfl.ai",
  },
  {
    id: "leonardo", label: "Leonardo.Ai", category: "Imagen/Video",
    description: "Imagen y assets de juego, modelos finetuned.",
    icon: Palette, accent: "from-yellow-500 to-amber-600",
    keyPlaceholder: "leonardo key…", defaultBaseUrl: "https://cloud.leonardo.ai", docsUrl: "https://docs.leonardo.ai",
  },
  {
    id: "ideogram", label: "Ideogram", category: "Imagen/Video",
    description: "Imagen con texto/tipografía de máxima fidelidad.",
    icon: Wand2, accent: "from-pink-500 to-rose-600",
    keyPlaceholder: "ideogram key…", defaultBaseUrl: "https://api.ideogram.ai", docsUrl: "https://developer.ideogram.ai",
  },
  {
    id: "recraft", label: "Recraft", category: "Imagen/Video",
    description: "Imagen vectorial y de marca, estilos consistentes.",
    icon: Camera, accent: "from-teal-500 to-cyan-600",
    keyPlaceholder: "recraft key…", defaultBaseUrl: "https://external.api.recraft.ai", docsUrl: "https://www.recraft.ai/docs",
  },
  {
    id: "pika", label: "Pika", category: "Imagen/Video",
    description: "Generación de video creativa y efectos.",
    icon: Film, accent: "from-fuchsia-500 to-purple-600",
    keyPlaceholder: "pika key…", docsUrl: "https://pika.art",
  },
  {
    id: "higgsfield", label: "Higgsfield", category: "Imagen/Video",
    description: "Video con control de cámara y efectos virales.",
    icon: Rocket, accent: "from-violet-500 to-indigo-600",
    keyPlaceholder: "hf key…", docsUrl: "https://higgsfield.ai",
    note: "Suele requerir 2 claves (key + secret).",
  },
  {
    id: "kling", label: "Kling (Kuaishou)", category: "Imagen/Video",
    description: "Video Kling 2.x / O1 — vía API oficial Kuaishou.",
    icon: Video, accent: "from-orange-500 to-red-600",
    keyPlaceholder: "access key…", docsUrl: "https://app.klingai.com",
    note: "Auth por JWT (access key + secret).",
  },

  // ───────────── LLM / Texto ─────────────
  {
    id: "openai", label: "OpenAI", category: "LLM/Texto",
    description: "GPT para guiones, prompts y texto. También TTS y Sora vía API oficial.",
    icon: Brain, accent: "from-emerald-500 to-teal-600",
    keyPlaceholder: "sk-…", defaultBaseUrl: "https://api.openai.com/v1", docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic", label: "Anthropic (Claude)", category: "LLM/Texto",
    description: "Claude — guiones largos, razonamiento y agentes.",
    icon: Bot, accent: "from-orange-500 to-amber-600",
    keyPlaceholder: "sk-ant-…", defaultBaseUrl: "https://api.anthropic.com", docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "google", label: "Google Gemini", category: "LLM/Texto",
    description: "Gemini para texto/multimodal. (Veo/Imagen vía Vertex aparte.)",
    icon: Atom, accent: "from-blue-500 to-cyan-600",
    keyPlaceholder: "AIza…", defaultBaseUrl: "https://generativelanguage.googleapis.com", docsUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "xai", label: "xAI (Grok)", category: "LLM/Texto",
    description: "Grok — texto e imagen (Grok Imagine).",
    icon: MessageSquare, accent: "from-zinc-500 to-slate-700",
    keyPlaceholder: "xai-…", defaultBaseUrl: "https://api.x.ai/v1", docsUrl: "https://console.x.ai",
  },
  {
    id: "nvidia", label: "NVIDIA NIM", category: "LLM/Texto",
    description: "build.nvidia.com — LLM e imagen acelerados (OpenAI-compatible).",
    icon: Cpu, accent: "from-lime-500 to-green-600",
    keyPlaceholder: "nvapi-…", defaultBaseUrl: "https://integrate.api.nvidia.com/v1", docsUrl: "https://build.nvidia.com",
  },
  {
    id: "mistral", label: "Mistral", category: "LLM/Texto",
    description: "Modelos europeos rápidos y económicos.",
    icon: Languages, accent: "from-orange-500 to-red-600",
    keyPlaceholder: "mistral key…", defaultBaseUrl: "https://api.mistral.ai/v1", docsUrl: "https://console.mistral.ai/api-keys",
  },
  {
    id: "groq", label: "Groq", category: "LLM/Texto",
    description: "Inferencia ultrarrápida (LPU) compatible con OpenAI.",
    icon: Rocket, accent: "from-red-500 to-orange-600",
    keyPlaceholder: "gsk_…", defaultBaseUrl: "https://api.groq.com/openai/v1", docsUrl: "https://console.groq.com/keys",
  },
  {
    id: "deepseek", label: "DeepSeek", category: "LLM/Texto",
    description: "Modelos de razonamiento muy económicos.",
    icon: MessageSquare, accent: "from-blue-500 to-indigo-600",
    keyPlaceholder: "sk-…", defaultBaseUrl: "https://api.deepseek.com", docsUrl: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "perplexity", label: "Perplexity", category: "LLM/Texto",
    description: "Sonar — respuestas con búsqueda web en tiempo real.",
    icon: Globe, accent: "from-teal-500 to-cyan-600",
    keyPlaceholder: "pplx-…", defaultBaseUrl: "https://api.perplexity.ai", docsUrl: "https://www.perplexity.ai/settings/api",
  },
  {
    id: "cohere", label: "Cohere", category: "LLM/Texto",
    description: "Command R+ y embeddings para RAG.",
    icon: MessageSquare, accent: "from-indigo-500 to-purple-600",
    keyPlaceholder: "cohere key…", defaultBaseUrl: "https://api.cohere.com", docsUrl: "https://dashboard.cohere.com/api-keys",
  },

  // ───────────── Voz / Audio ─────────────
  {
    id: "elevenlabs", label: "ElevenLabs", category: "Voz/Audio",
    description: "Voz IA y text-to-speech para locuciones y doblaje.",
    icon: Mic, accent: "from-fuchsia-500 to-purple-600",
    keyPlaceholder: "elevenlabs key…", defaultBaseUrl: "https://api.elevenlabs.io", docsUrl: "https://elevenlabs.io/app/settings/api-keys",
  },
  {
    id: "playht", label: "PlayHT", category: "Voz/Audio",
    description: "TTS realista y clonación de voz.",
    icon: AudioLines, accent: "from-cyan-500 to-blue-600",
    keyPlaceholder: "playht secret…", defaultBaseUrl: "https://api.play.ht", docsUrl: "https://play.ht/studio/api-access",
    note: "Requiere también User ID además de la API key.",
  },
  {
    id: "cartesia", label: "Cartesia", category: "Voz/Audio",
    description: "Sonic — TTS de baja latencia en tiempo real.",
    icon: Radio, accent: "from-emerald-500 to-teal-600",
    keyPlaceholder: "sk_car_…", defaultBaseUrl: "https://api.cartesia.ai", docsUrl: "https://play.cartesia.ai/keys",
  },
  {
    id: "deepgram", label: "Deepgram", category: "Voz/Audio",
    description: "Speech-to-text rápido y preciso (transcripción).",
    icon: AudioLines, accent: "from-green-500 to-emerald-600",
    keyPlaceholder: "deepgram key…", defaultBaseUrl: "https://api.deepgram.com", docsUrl: "https://console.deepgram.com",
  },
  {
    id: "assemblyai", label: "AssemblyAI", category: "Voz/Audio",
    description: "Transcripción + comprensión de audio (STT).",
    icon: Mic, accent: "from-violet-500 to-indigo-600",
    keyPlaceholder: "assemblyai key…", defaultBaseUrl: "https://api.assemblyai.com", docsUrl: "https://www.assemblyai.com/app/account",
  },

  // ───────────── Agregadores ─────────────
  {
    id: "replicate", label: "Replicate", category: "Agregador",
    description: "Miles de modelos (imagen, video, audio, LLM) bajo una API.",
    icon: Boxes, accent: "from-slate-500 to-zinc-700",
    keyPlaceholder: "r8_…", defaultBaseUrl: "https://api.replicate.com", docsUrl: "https://replicate.com/account/api-tokens",
  },
  {
    id: "fal", label: "fal.ai", category: "Agregador",
    description: "Inferencia rápida de modelos de imagen/video.",
    icon: Workflow, accent: "from-purple-500 to-violet-600",
    keyPlaceholder: "fal key…", defaultBaseUrl: "https://fal.run", docsUrl: "https://fal.ai/dashboard/keys",
  },
  {
    id: "openrouter", label: "OpenRouter", category: "Agregador",
    description: "Un endpoint para cientos de LLMs de todos los proveedores.",
    icon: Network, accent: "from-sky-500 to-blue-600",
    keyPlaceholder: "sk-or-…", defaultBaseUrl: "https://openrouter.ai/api/v1", docsUrl: "https://openrouter.ai/keys",
  },
  {
    id: "together", label: "Together AI", category: "Agregador",
    description: "LLMs e imagen open-source a escala (OpenAI-compatible).",
    icon: Layers, accent: "from-blue-500 to-indigo-600",
    keyPlaceholder: "together key…", defaultBaseUrl: "https://api.together.xyz/v1", docsUrl: "https://api.together.ai/settings/api-keys",
  },
  {
    id: "huggingface", label: "Hugging Face", category: "Agregador",
    description: "Inference API / routers — modelos open-source.",
    icon: Sparkles, accent: "from-yellow-500 to-amber-600",
    keyPlaceholder: "hf_…", defaultBaseUrl: "https://huggingface.co", docsUrl: "https://huggingface.co/settings/tokens",
  },
];

export function getProviderSpec(id: string): ProviderSpec | undefined {
  return PROVIDER_CATALOG.find((p) => p.id === id.toLowerCase());
}

/** Catálogo agrupado por categoría, respetando CATEGORY_ORDER. */
export function catalogByCategory(): { category: ProviderCategory; items: ProviderSpec[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: PROVIDER_CATALOG.filter((p) => p.category === category),
  })).filter((g) => g.items.length > 0);
}
