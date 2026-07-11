import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CORS para el Planificador cuando lo consume otro front-end (ej. clipsmusic
 * en otro dominio). Permite login + subida + programación desde orígenes
 * autorizados. La auth real sigue siendo el token `x-admin-secret`, así que
 * abrir CORS a estos orígenes no expone nada por sí mismo.
 *
 * Orígenes permitidos: los de por defecto (dev) + los de la env
 * `PLANNER_ALLOWED_ORIGINS` (separados por coma), ej:
 *   PLANNER_ALLOWED_ORIGINS="https://clipsmusic.vercel.app,https://midominio.com"
 */
const DEFAULT_ORIGINS = [
  "http://localhost:3100", // clipsmusic dev (Vite)
  "http://localhost:5173", // Vite por defecto
];

const envOrigins = (process.env.PLANNER_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = new Set([...DEFAULT_ORIGINS, ...envOrigins]);

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-secret",
  "Access-Control-Max-Age": "86400",
};

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowed = allowedOrigins.has(origin);

  // Preflight
  if (request.method === "OPTIONS") {
    return NextResponse.json(
      {},
      { headers: { ...(isAllowed && { "Access-Control-Allow-Origin": origin }), ...corsHeaders } }
    );
  }

  const response = NextResponse.next();
  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    for (const [k, v] of Object.entries(corsHeaders)) response.headers.set(k, v);
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
