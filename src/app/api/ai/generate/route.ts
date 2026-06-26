import { NextRequest, NextResponse } from "next/server";
import { MuapiError } from "@/lib/ai/muapi";
import { createGen, type GenInput } from "@/lib/ai/router";

/**
 * POST /api/ai/generate
 * Inicia un job de generación con el proveedor elegido. Devuelve job_id (prefijado) para polling.
 *
 * Body: { provider?: "muapi"|"fal"|"replicate", model, prompt, ...input }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { provider?: string; model?: string } & GenInput;
    const { provider = "muapi", model, ...input } = body;

    if (!model || !input.prompt) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: model y prompt" },
        { status: 400 }
      );
    }

    const job = await createGen(provider, model, input);
    return NextResponse.json(job, { status: 202 });
  } catch (e) {
    if (e instanceof MuapiError) {
      return NextResponse.json({ error: e.message, details: e.body }, { status: e.status });
    }
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
