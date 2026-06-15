import { NextRequest, NextResponse } from "next/server";
import { validateLicense } from "@/lib/license";

/**
 * POST /api/license/validate   Body: { key }
 * Endpoint público que llama el software (YF Auto Clip) al activarse.
 * Devuelve { valid, reason?, product?, activations?, maxActivations? }.
 */
export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();
    if (!key || typeof key !== "string") {
      return NextResponse.json({ valid: false, reason: "missing_key" }, { status: 400 });
    }
    const result = await validateLicense(key);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ valid: false, reason: "bad_request" }, { status: 400 });
  }
}
