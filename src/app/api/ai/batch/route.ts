import { NextRequest, NextResponse } from "next/server";
import { MuapiError, type MuapiGenerateRequest } from "@/lib/ai/muapi";
import { createGen } from "@/lib/ai/router";
import { getAdminProfitUSD, getCustomerPriceUSD, getRealCostUSD, ADMIN_MARGIN_PCT } from "@/lib/pricing";

/**
 * POST /api/ai/batch
 * Lanza N generaciones en paralelo. Devuelve array de jobs + reporte financiero.
 *
 * Body:
 * {
 *   model: "veo3-fast-text-to-video",
 *   prompts: ["prompt 1", "prompt 2", ...],
 *   shared?: { duration: 5, aspect_ratio: "16:9", width: 1024, height: 1024 }
 *   concurrency?: 5   // máximo de jobs simultáneos enviados (default 5)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      provider?: string;
      model: string;
      prompts: string[];
      shared?: Partial<MuapiGenerateRequest>;
      concurrency?: number;
    };
    const provider = body.provider ?? "muapi";

    if (!body.model || !Array.isArray(body.prompts) || body.prompts.length === 0) {
      return NextResponse.json({ error: "Faltan model o prompts" }, { status: 400 });
    }
    if (body.prompts.length > 50) {
      return NextResponse.json({ error: "Máximo 50 prompts por batch" }, { status: 400 });
    }

    const concurrency = Math.min(Math.max(body.concurrency ?? 5, 1), 10);
    const prompts = body.prompts.map((p) => p.trim()).filter(Boolean);

    type Result =
      | { index: number; status: "queued"; jobId: string }
      | { index: number; status: "completed"; output: string[] }
      | { index: number; status: "error"; error: string };

    const results: Result[] = [];
    const TERMINAL = new Set(["completed", "succeeded"]);

    // Procesamiento por chunks (concurrency limit)
    for (let i = 0; i < prompts.length; i += concurrency) {
      const chunk = prompts.slice(i, i + concurrency);
      const settled = await Promise.allSettled(
        chunk.map((prompt, idx) =>
          createGen(provider, body.model, { prompt, ...body.shared }).then((job) => ({ job, index: i + idx }))
        )
      );

      settled.forEach((s, idx) => {
        const globalIdx = i + idx;
        if (s.status === "fulfilled") {
          const job = s.value.job;
          if (TERMINAL.has(job.status)) {
            results.push({ index: globalIdx, status: "completed", output: job.output ?? [] });
          } else {
            results.push({ index: globalIdx, status: "queued", jobId: job.id });
          }
        } else {
          const err = s.reason;
          const msg = err instanceof MuapiError ? err.message : (err instanceof Error ? err.message : "Error");
          results.push({ index: globalIdx, status: "error", error: msg });
        }
      });
    }

    // Reporte financiero del batch
    const successful = results.filter((r) => r.status === "queued" || r.status === "completed").length;
    const realCost      = getRealCostUSD(body.model) * successful;
    const customerPrice = getCustomerPriceUSD(body.model) * successful;
    const adminProfit   = getAdminProfitUSD(body.model) * successful;

    return NextResponse.json({
      model: body.model,
      totalRequested: prompts.length,
      successful,
      failed: results.length - successful,
      results,
      finance: {
        realCostUSD:      +realCost.toFixed(4),
        customerPriceUSD: +customerPrice.toFixed(4),
        adminProfitUSD:   +adminProfit.toFixed(4),
        marginPct:        ADMIN_MARGIN_PCT,
      },
    }, { status: 202 });

  } catch (e) {
    if (e instanceof MuapiError) {
      return NextResponse.json({ error: e.message, details: e.body }, { status: e.status });
    }
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
