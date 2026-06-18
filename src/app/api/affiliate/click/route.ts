import { NextRequest, NextResponse } from "next/server";
import { trackAffiliateClick } from "@/lib/affiliate";

export const runtime = "nodejs";

/** POST /api/affiliate/click?ref=CODE — suma un clic (best-effort, público). */
export async function POST(req: NextRequest) {
  const ref = (req.nextUrl.searchParams.get("ref") || "").trim().toLowerCase();
  if (ref) {
    try { await trackAffiliateClick(ref); } catch { /* noop */ }
  }
  return NextResponse.json({ ok: true });
}
