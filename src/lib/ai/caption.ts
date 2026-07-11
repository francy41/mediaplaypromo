import "server-only";
import { getIntegration } from "@/lib/integrations";

/**
 * Generador de captions con IA (texto), reutilizando el proveedor NVIDIA
 * (OpenAI-compatible) ya configurado en /integrations. Mismo patrón que
 * `orchestrator.ts`, pero devuelve un caption + hashtags listos para publicar.
 *
 * Server-only — nunca importar desde "use client".
 */

const DEFAULT_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct";

const SYSTEM_PROMPT = `Eres un experto en copywriting para redes sociales y marketing de contenido.
Generas captions LISTOS PARA PUBLICAR que enganchan y convierten.
Respondes SIEMPRE en el idioma indicado. NUNCA respondes en lenguaje natural fuera del JSON.
Devuelves SOLO un JSON válido con esta forma exacta:
{"caption":"texto del caption con emojis, gancho inicial, 3-4 beneficios y una llamada a la acción con el enlace si se proporciona","hashtags":["#ejemplo","#otro"]}
Reglas:
- El caption NO debe incluir hashtags dentro del texto (van aparte en "hashtags").
- Usa emojis con moderación y saltos de línea para que se lea bien.
- Si hay enlace, inclúyelo en la llamada a la acción.
- Adapta el tono y la longitud a la plataforma indicada.
- Los hashtags deben ser relevantes al nicho, en minúsculas, sin espacios ni acentos.
- Nunca uses Markdown. Nunca expliques. Solo el JSON.`;

export interface CaptionAIInput {
  brief: string;
  brand?: string;
  link?: string;
  platform?: string;
  language?: string;
}

export interface CaptionAIResult {
  ok: boolean;
  caption?: string;
  hashtags?: string[];
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

function normHashtags(v: unknown): string[] {
  const arr = Array.isArray(v) ? v : typeof v === "string" ? (v as string).split(/[\s,]+/) : [];
  return arr
    .map((h) => String(h).trim())
    .filter(Boolean)
    .map((h) => (h.startsWith("#") ? h : `#${h}`));
}

/** Genera un caption + hashtags a partir del brief del proyecto usando la IA. */
export async function generateCaptionAI(input: CaptionAIInput): Promise<CaptionAIResult> {
  const brief = (input.brief || "").trim();
  if (!brief) return { ok: false, error: "Describe el nicho/producto antes de generar." };

  const integ = await getIntegration("nvidia");
  if (!integ?.apiKey) {
    return { ok: false, error: "NVIDIA no está configurado. Añade la clave en /integrations para usar la IA." };
  }

  const base = (integ.baseUrl || "https://integrate.api.nvidia.com/v1").replace(/\/+$/, "");
  const model = DEFAULT_MODEL;
  const language = input.language || "es";

  const parts = [
    `Nicho/producto: ${brief}`,
    input.brand ? `Marca/cuenta: ${input.brand}` : "",
    input.link ? `Enlace (CTA): ${input.link}` : "",
    input.platform ? `Plataforma: ${input.platform}` : "",
    `Idioma: ${language}`,
  ].filter(Boolean);

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${integ.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: parts.join("\n") },
        ],
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 1024,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const m = data?.detail || data?.error?.message || data?.message || `HTTP ${res.status}`;
      return { ok: false, model, error: typeof m === "string" ? m : JSON.stringify(m).slice(0, 300) };
    }
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(content);
    if (!parsed || typeof parsed.caption !== "string") {
      return { ok: false, model, error: "La IA no devolvió un caption válido.", raw: content.slice(0, 600) };
    }
    return { ok: true, model, caption: parsed.caption.trim(), hashtags: normHashtags(parsed.hashtags) };
  } catch (e) {
    return { ok: false, model, error: e instanceof Error ? e.message : "error" };
  }
}
