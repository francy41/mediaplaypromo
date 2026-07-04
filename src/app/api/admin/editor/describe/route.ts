import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/lib/integrations";
import { resolveOwner } from "@/lib/planner-admins";

export const runtime = "nodejs";
export const maxDuration = 60;

async function authed(req: NextRequest): Promise<boolean> {
  return !!(await resolveOwner(req.headers.get("x-admin-secret")));
}

/**
 * POST /api/admin/editor/describe  Body: { image: dataURL }
 * Describe la imagen de referencia con NVIDIA Vision (gratis) → frase para guiar la generación.
 */
export async function POST(req: NextRequest) {
  if (!(await authed(req))) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const image = String(body.image ?? "");
  if (!image.startsWith("data:")) return NextResponse.json({ error: "Imagen inválida" }, { status: 400 });

  const integ = await getIntegration("nvidia");
  if (!integ?.apiKey) return NextResponse.json({ error: "Conecta NVIDIA en Integraciones." }, { status: 400 });
  const base = (integ.baseUrl || "https://integrate.api.nvidia.com/v1").replace(/\/+$/, "");

  try {
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${integ.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [{ role: "user", content: [
          { type: "text", text: "Describe the main subject of this image in ONE concise English phrase for image generation (appearance, clothing, colors, style). Only the phrase, no preamble." },
          { type: "image_url", image_url: { url: image } },
        ] }],
        max_tokens: 80, temperature: 0.2,
      }),
      cache: "no-store",
    });
    const d = await r.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>;
    if (!r.ok) return NextResponse.json({ error: (d.error as { message?: string })?.message || `NVIDIA error ${r.status}` }, { status: 502 });
    const desc = String((d.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ?? "").trim().replace(/^["']|["']$/g, "");
    return NextResponse.json({ description: desc });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
