import { NextRequest, NextResponse } from "next/server";
import { MuapiError } from "@/lib/ai/muapi";
import { getGenJob } from "@/lib/ai/router";

/**
 * GET /api/ai/status/[id]
 * Polling del estado de un job. El id está prefijado con el proveedor
 * (provider::model::rawId); los ids antiguos sin prefijo se tratan como Muapi.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await getGenJob(id);
    return NextResponse.json(job);
  } catch (e) {
    if (e instanceof MuapiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
