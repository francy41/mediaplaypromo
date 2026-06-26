import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function authed(req: NextRequest): boolean {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

// Allowlist de hosts (evita SSRF / proxy abierto).
const ALLOWED = [/(^|\.)pexels\.com$/i, /(^|\.)archive\.org$/i, /(^|\.)wikimedia\.org$/i];

/**
 * GET /api/admin/stock/proxy?url=<media url>
 * Descarga bytes de media (Pexels/Archive) server-side para que el render
 * client-side (ffmpeg.wasm) los lea sin bloqueos de CORS. Solo SuperAdmin.
 */
export async function GET(req: NextRequest) {
  if (!authed(req)) return new NextResponse("No autorizado", { status: 401 });

  const u = new URL(req.url).searchParams.get("url");
  if (!u) return new NextResponse("url requerida", { status: 400 });

  let target: URL;
  try { target = new URL(u); } catch { return new NextResponse("url inválida", { status: 400 }); }
  if (target.protocol !== "https:" || !ALLOWED.some((re) => re.test(target.hostname))) {
    return new NextResponse("host no permitido", { status: 403 });
  }

  try {
    const r = await fetch(target.toString(), { cache: "no-store", redirect: "follow" });
    if (!r.ok) return new NextResponse(`upstream ${r.status}`, { status: 502 });
    const buf = await r.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": r.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : "error", { status: 502 });
  }
}
