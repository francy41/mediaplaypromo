import "server-only";
import { getIntegration } from "@/lib/integrations";

/**
 * Orquestador de contenido de video con IA.
 * Convierte un TEMA en un plan de producción JSON estructurado (escenas,
 * keywords de búsqueda, voiceover, subtítulos…) usando un LLM (NVIDIA por defecto).
 * El plan lo consume el resto del pipeline: búsqueda de medios → voz → subtítulos → edición.
 */

export const ORCHESTRATOR_SYSTEM_PROMPT = `You are an expert AI specialized in generating viral video projects automatically.
Your purpose is to transform ANY user topic into a structured video production plan.
You NEVER answer in natural language. You ALWAYS return valid JSON.
Your output will be consumed by another application that will: search real videos on Internet Archive, search stock videos, download media, generate voice, create subtitles, and edit the final video automatically.

STEP 1: Detect the content category (Biography, Artist, Singer, Actor, Football Player, Athlete, Celebrity, Politician, Entrepreneur, Company, Historical Event, War, Country, City, Landmark, Science, Technology, AI, Space, Animals, Nature, Luxury, Cars, Gaming, Movies, Music, Crime, Mystery, Paranormal, Conspiracy, Documentary, Tutorial, Education, Finance, Business, Motivation, Health, Fitness, Food, Travel, History, News, Trending, Viral, Other).

STEP 2: Choose the best storytelling style (documentary, cinematic, news, biography, sports, educational, investigation, viral, emotional, motivational, thriller, horror, mystery, podcast, storytelling, timeline).

STEP 3: Generate an optimized production plan. Return ONLY valid JSON.

JSON FORMAT:
{"category":"","style":"","title":"","description":"","language":"es","target_platform":"youtube","duration":180,"hook":"","seo_keywords":[],"archive_keywords":[],"stock_keywords":[],"music_style":"","voice_style":"","thumbnail":{"title":"","visual":""},"scenes":[]}

Each scene must contain:
{"scene_number":1,"duration":8,"type":"","title":"","goal":"","voiceover":"","subtitle":"","emotion":"","camera":"","transition":"","music":"","sound_fx":"","visual_description":"","archive_search":[],"stock_search":[],"people":[],"locations":[],"objects":[],"timeline_year":"","importance":"high"}

RULES:
- Detect automatically if the topic is a person, place, event, legend, company, product, animal, sport, historical event, technology, politics, or entertainment, and adapt the storytelling.
- PERSON: Early life, Career, Major achievements, Controversies (only well-established public info), Legacy.
- SPORT PLAYER: Early life, Youth career, Professional debut, Major clubs, National team, Titles, Records, Current status.
- ARTIST: Origins, Career, Albums, Awards, Influence, Current projects.
- PARANORMAL: Origin, Legend, Witness reports (as claims/folklore, not facts), Possible explanations, Current relevance.
- HISTORY: chronological timeline.
- SEARCH KEYWORDS: always in English, optimized for Internet Archive, Pexels, Pixabay, Wikimedia Commons, Unsplash. Never long sentences — only keywords.
- VOICEOVER: maximum 3 sentences per scene, high retention, professional narration (in the plan language).
- SUBTITLES: maximum 6 words, optimized for TikTok.
- HOOK: the first 5 seconds must maximize curiosity.
- ENDING: always end with a question or a call to action.
- Never produce Markdown. Never explain. Never answer outside JSON. The JSON must always be valid.
- If the user only provides a topic, automatically generate the complete production plan.`;

// Modelo NVIDIA por defecto (cambiable por env o por parámetro). NVIDIA es OpenAI-compatible.
const DEFAULT_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct";

export interface OrchestratorResult {
  ok: boolean;
  plan?: Record<string, unknown>;
  model?: string;
  error?: string;
  raw?: string;
}

/** Extrae JSON de la respuesta del LLM (quita fences ```json y texto sobrante). */
function extractJson(text: string): Record<string, unknown> | null {
  let t = (text ?? "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try { return JSON.parse(t); } catch { /* sigue */ }
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  if (s >= 0 && e > s) {
    try { return JSON.parse(t.slice(s, e + 1)); } catch { /* sigue */ }
  }
  return null;
}

/** Genera el plan de producción de video a partir de un tema. */
export async function generateVideoPlan(
  topic: string,
  opts?: { model?: string; language?: string; platform?: string; duration?: number }
): Promise<OrchestratorResult> {
  const integ = await getIntegration("nvidia");
  if (!integ?.apiKey) return { ok: false, error: "NVIDIA no está configurado. Añade la clave en /integrations." };

  const base = (integ.baseUrl || "https://integrate.api.nvidia.com/v1").replace(/\/+$/, "");
  const model = opts?.model || DEFAULT_MODEL;

  // Pistas opcionales (idioma/plataforma/duración) que se añaden al tema.
  const hints: string[] = [];
  if (opts?.language) hints.push(`language: ${opts.language}`);
  if (opts?.platform) hints.push(`target_platform: ${opts.platform}`);
  if (opts?.duration) hints.push(`duration: ${opts.duration} seconds`);
  const userContent = hints.length ? `${topic}\n\n[constraints] ${hints.join(", ")}` : topic;

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${integ.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: ORCHESTRATOR_SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 4096,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const m = data?.detail || data?.error?.message || data?.message || `HTTP ${res.status}`;
      return { ok: false, model, error: typeof m === "string" ? m : JSON.stringify(m).slice(0, 300) };
    }
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    const plan = extractJson(content);
    if (!plan) return { ok: false, model, error: "La IA no devolvió JSON válido.", raw: content.slice(0, 600) };
    return { ok: true, model, plan };
  } catch (e) {
    return { ok: false, model, error: e instanceof Error ? e.message : "error" };
  }
}
