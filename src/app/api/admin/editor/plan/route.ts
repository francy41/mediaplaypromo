import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/lib/integrations";
import { resolveOwner } from "@/lib/planner-admins";

export const runtime = "nodejs";
export const maxDuration = 60;

async function authed(req: NextRequest): Promise<boolean> {
  return !!(await resolveOwner(req.headers.get("x-admin-secret")));
}

interface Scene { narration: string; query: string; visual: string; seconds: number }

/** Extrae el array de escenas de la salida del modelo, tolerando fences/objeto/prosa. */
function parseScenes(content: string): Scene[] | null {
  if (!content) return null;
  const t = content.trim().replace(/^```(?:json)?/i, "").replace(/```\s*$/i, "").trim();
  const tryParse = (str: string): unknown => { try { return JSON.parse(str); } catch { return null; } };

  let data: unknown = tryParse(t);
  if (data === null) {
    const a = t.indexOf("["), b = t.lastIndexOf("]");
    if (a !== -1 && b > a) data = tryParse(t.slice(a, b + 1));
  }
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.scenes)) data = obj.scenes;
  }
  if (!Array.isArray(data)) return null;

  const scenes = (data as Record<string, unknown>[])
    .filter((s) => s && typeof s.narration === "string" && (s.narration as string).trim())
    .map((s) => {
      const narration = String(s.narration).trim();
      const query = (typeof s.query === "string" && (s.query as string).trim()) ? (s.query as string).trim() : narration.split(/\s+/).slice(0, 3).join(" ");
      const visual = (typeof s.visual === "string" && (s.visual as string).trim()) ? (s.visual as string).trim() : query;
      return { narration, query, visual, seconds: Math.min(Math.max(Math.round(Number(s.seconds) || 6), 3), 30) };
    });
  return scenes.length ? scenes : null;
}

async function callModel(baseUrl: string, key: string, sys: string, user: string, maxTokens = 2000, timeoutMs = 35000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct", // rápido y fiable dentro del límite de 60s
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
      cache: "no-store",
      signal: ctrl.signal,
    });
    const d = await r.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>;
    if (!r.ok) throw new Error((d.error as { message?: string })?.message || (d.detail as string) || `NVIDIA error ${r.status}`);
    return (d.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(t);
  }
}

/**
 * POST /api/admin/editor/plan  Body: { prompt, durationSec, lang }
 * Genera el guión por escenas con NVIDIA (gratis). Robusto: parseo tolerante + reintento.
 */
export async function POST(req: NextRequest) {
  if (!(await authed(req))) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt ?? "").trim();
  const durationSec = Math.min(Math.max(parseInt(body.durationSec, 10) || 60, 15), 1800);
  const lang = body.lang === "en" ? "English" : "Spanish";
  if (!prompt) return NextResponse.json({ error: "Falta el prompt" }, { status: 400 });

  const integ = await getIntegration("nvidia");
  if (!integ?.apiKey) {
    return NextResponse.json({ error: "Conecta NVIDIA en Integraciones / APIs (es gratis) para generar el guión." }, { status: 400 });
  }
  const baseUrl = integ.baseUrl || "https://integrate.api.nvidia.com/v1";

  // Modo 1: nº de escenas fijo × segundos por escena (control fino, p.ej. 40×10s).
  // Modo 2 (por defecto): documental por duración total (escenas largas de párrafo).
  const reqCount = parseInt(body.sceneCount, 10) || 0;
  const reqSec = parseInt(body.sceneSeconds, 10) || 0;
  let target: number, per: number;
  if (reqCount > 0) {
    target = Math.min(Math.max(reqCount, 1), 40);
    per = Math.min(Math.max(reqSec || 10, 3), 60);
  } else {
    target = Math.min(Math.max(Math.round(durationSec / 25), 1), 12);
    per = Math.min(Math.max(Math.round(durationSec / target), 15), 60);
  }
  const wordsPerScene = Math.max(6, Math.round(per * 2.4)); // ~2.4 palabras/seg al narrar

  const sys = `You are an expert video scriptwriter. You write scripts for ANY kind of short video: narrative stories, documentaries, biographies of real people, historical or news pieces, explainers/educational, product ads, travel, etc. Automatically adopt the tone and format that best fits the user's TOPIC.
The whole script MUST be entirely and specifically about the user's exact topic. NEVER drift into an unrelated or generic story — every scene must clearly belong to THIS topic. If the topic names a real person, place or event, keep the script about that person/place/event.
Return ONLY a JSON array — no markdown, no code fences, no text before or after.
Each item has EXACTLY these keys: {"narration": string, "query": string, "visual": string, "seconds": number}.
- "narration": narrator voiceover in ${lang} of about ${wordsPerScene} words (≈ ${per} seconds of speech). It MUST continue coherently from the previous scene and keep advancing the topic (setup → development → conclusion across the scenes). Specific about the topic — no generic filler, no repetition.
- "query": 2-4 English keywords for real stock b-roll that LITERALLY depicts this scene's subject and setting (matching the topic). Concrete, filmable things. Never copyrighted character names.
- "visual": a vivid English image/video-generation prompt of the scene (subject + setting + action + lighting), ending with ", cinematic, consistent style".
- "seconds": integer between ${Math.max(3, per - 3)} and ${per + 3}.
The ${target} scenes must read as ONE continuous, coherent narration about the topic — each flows naturally into the next, with a clear beginning, development and ending. Keep a consistent visual style. Produce EXACTLY ${target} scenes. Never repeat a query.`;
  const user = `Topic: ${prompt}\nTotal duration: ${durationSec} seconds. Exactly ${target} scenes, all strictly about this exact topic. Choose the best format (story / documentary / ad / biography / explainer) for it.`;

  // Tokens ajustados al tamaño de narración por escena (sin agotar el límite de 60s).
  const maxTokens = Math.min(4096, target * (wordsPerScene * 2 + 70) + 300);

  try {
    let scenes: Scene[] | null = null;
    // 1º intento con el prompt on-topic completo.
    try { scenes = parseScenes(await callModel(baseUrl, integ.apiKey, sys, user, maxTokens)); } catch { scenes = null; }
    if (!scenes) {
      // 2º: reintento más estricto de formato.
      const sys2 = `Output ONLY a valid JSON array of exactly ${target} objects, each {"narration","query","visual","seconds"}. ${lang} narration, all strictly about: ${prompt}. No markdown, no extra text.`;
      try { scenes = parseScenes(await callModel(baseUrl, integ.apiKey, sys2, user, maxTokens)); } catch { scenes = null; }
    }
    if (!scenes) return NextResponse.json({ error: "El modelo no devolvió un guión válido. Reintenta." }, { status: 502 });

    const totalSec = scenes.reduce((a, s) => a + s.seconds, 0);
    return NextResponse.json({ title: prompt.slice(0, 80), totalSec, scenes });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error de red" }, { status: 500 });
  }
}
