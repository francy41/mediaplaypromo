import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/planner-admins";

export const runtime = "nodejs";

/**
 * POST /api/planner-auth  { username, password }
 * Login del Planificador. Devuelve un token de sesión opaco que el cliente
 * guarda y manda como `x-admin-secret` en el resto de llamadas.
 *  - Admin: usuario + contraseña que creó el SuperAdmin.
 *  - SuperAdmin: su email + contraseña del dashboard.
 */
export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}));
  const r = await verifyCredentials(String(username ?? ""), String(password ?? ""));
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error || "No autorizado" }, { status: 401 });
  return NextResponse.json({ ok: true, token: r.token, role: r.role, name: r.name });
}
