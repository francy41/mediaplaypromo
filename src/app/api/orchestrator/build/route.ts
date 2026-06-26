import { NextRequest, NextResponse } from "next/server";
import { generateVideoPlan } from "@/lib/ai/orchestrator";
import { searchMedia, type MediaItem } from "@/lib/media-sources";

export const runtime = "nodejs";
export const maxDuration = 60;

function authed(req: NextRequest): boolean {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

/** Construye la query de búsqueda de una escena a partir de sus keywords. */
function sceneQuery(scene: Record<string, unknown>): string {
  const arr = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).map(String) : []);
  const kws = [...arr(scene.archive_search), ...arr(scene.stock_search)];
  if (kws.length) return kws.slice(0, 2).join(" ");
  return String(scene.title ?? scene.visual_description ?? "").slice(0, 60);
}

/**
 * POST /api/orchestrator/build
 * Body: { topic, model?, language?, platform?, duration?, perScene? }
 * 1) Genera el plan con la IA. 2) Busca medios (Archive + Wikimedia) por cada escena.
 * Devuelve el plan con `media` adjunto a cada escena → listo para el editor.
 */
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const topic = String(body.topic ?? "").trim();
  if (!topic) return NextResponse.json({ ok: false, error: "Falta el tema (topic)." }, { status: 400 });

  const perScene = Math.min(8, Math.max(1, Number(body.perScene ?? 4) || 4));

  const planRes = await generateVideoPlan(topic, {
    model: body.model,
    language: body.language,
    platform: body.platform,
    duration: typeof body.duration === "number" ? body.duration : undefined,
  });
  if (!planRes.ok || !planRes.plan) {
    return NextResponse.json({ ok: false, error: planRes.error ?? "No se pudo generar el plan", raw: planRes.raw }, { status: 502 });
  }

  const plan = planRes.plan;
  const scenesRaw = Array.isArray(plan.scenes) ? (plan.scenes as Record<string, unknown>[]) : [];
  const scenes = scenesRaw.slice(0, 24); // tope de seguridad para el límite de 60s

  // Buscar medios por escena en paralelo (consultas a fuentes gratis).
  const enriched = await Promise.all(
    scenes.map(async (scene) => {
      const q = sceneQuery(scene);
      let media: MediaItem[] = [];
      try { media = q ? await searchMedia(q, "all", perScene) : []; } catch { media = []; }
      return { ...scene, query: q, media };
    })
  );

  return NextResponse.json({
    ok: true,
    model: planRes.model,
    plan: { ...plan, scenes: enriched },
    totalScenes: enriched.length,
    totalMedia: enriched.reduce((n, s) => n + s.media.length, 0),
  });
}
