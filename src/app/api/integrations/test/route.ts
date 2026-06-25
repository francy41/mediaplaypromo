import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/lib/integrations";

export const runtime = "nodejs";

function authed(req: NextRequest): boolean {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

type AuthStyle = "bearer" | "x-api-key" | "xi-api-key" | "token" | "authorization-raw" | "anthropic" | "key-query";

interface TestSpec {
  base: string;
  path: string;
  auth: AuthStyle;
  /** Si true: éxito = la auth no fue rechazada (no 401/403), aunque el recurso no exista. */
  okAuth?: boolean;
}

/**
 * Cómo probar cada proveedor conocido. La mayoría exponen GET /models con
 * Bearer; el resto usa su propia cabecera. Los que no tienen test fiable
 * (runway, luma, fal, kling, higgsfield, playht…) caen al best-effort.
 */
const PROVIDER_TESTS: Record<string, TestSpec> = {
  // OpenAI-compatible (Bearer + /models)
  openai: { base: "https://api.openai.com/v1", path: "/models", auth: "bearer" },
  nvidia: { base: "https://integrate.api.nvidia.com/v1", path: "/models", auth: "bearer" },
  mistral: { base: "https://api.mistral.ai/v1", path: "/models", auth: "bearer" },
  groq: { base: "https://api.groq.com/openai/v1", path: "/models", auth: "bearer" },
  xai: { base: "https://api.x.ai/v1", path: "/models", auth: "bearer" },
  deepseek: { base: "https://api.deepseek.com", path: "/models", auth: "bearer" },
  openrouter: { base: "https://openrouter.ai/api/v1", path: "/models", auth: "bearer" },
  together: { base: "https://api.together.xyz/v1", path: "/models", auth: "bearer" },
  cohere: { base: "https://api.cohere.com", path: "/v1/models", auth: "bearer" },
  // Cabeceras propias
  anthropic: { base: "https://api.anthropic.com", path: "/v1/models", auth: "anthropic" },
  google: { base: "https://generativelanguage.googleapis.com", path: "/v1beta/models", auth: "key-query" },
  huggingface: { base: "https://huggingface.co", path: "/api/whoami-v2", auth: "bearer" },
  replicate: { base: "https://api.replicate.com", path: "/v1/account", auth: "bearer" },
  stability: { base: "https://api.stability.ai", path: "/v1/user/account", auth: "bearer" },
  leonardo: { base: "https://cloud.leonardo.ai", path: "/api/rest/v1/me", auth: "bearer" },
  elevenlabs: { base: "https://api.elevenlabs.io", path: "/v1/user", auth: "xi-api-key" },
  deepgram: { base: "https://api.deepgram.com", path: "/v1/projects", auth: "token" },
  assemblyai: { base: "https://api.assemblyai.com", path: "/v2/transcript?limit=1", auth: "authorization-raw" },
  // MUAPI: sin endpoint de ping → pedimos un job inexistente y miramos solo la auth
  muapi: { base: "https://api.muapi.ai", path: "/api/v1/predictions/connection-test-0000/result", auth: "x-api-key", okAuth: true },
};

interface TestResult { ok: boolean; status: number; message: string }

async function fetchWithTimeout(url: string, init: RequestInit, ms = 10_000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(t);
  }
}

const trim = (u: string) => u.replace(/\/+$/, "");

function authHeaders(auth: AuthStyle, key: string): Record<string, string> {
  switch (auth) {
    case "bearer": return { Authorization: `Bearer ${key}` };
    case "x-api-key": return { "x-api-key": key };
    case "xi-api-key": return { "xi-api-key": key };
    case "token": return { Authorization: `Token ${key}` };
    case "authorization-raw": return { authorization: key };
    case "anthropic": return { "x-api-key": key, "anthropic-version": "2023-06-01" };
    case "key-query": return {};
  }
}

async function testProvider(provider: string, apiKey: string, overrideBase: string): Promise<TestResult> {
  try {
    const spec = PROVIDER_TESTS[provider];
    if (spec) {
      const base = trim(overrideBase || spec.base);
      let url = `${base}${spec.path}`;
      if (spec.auth === "key-query") url += (url.includes("?") ? "&" : "?") + "key=" + encodeURIComponent(apiKey);
      const res = await fetchWithTimeout(url, { headers: authHeaders(spec.auth, apiKey) });
      const ok = spec.okAuth ? res.status !== 401 && res.status !== 403 : res.ok;
      return { ok, status: res.status, message: ok ? "Clave válida ✓" : `Rechazada (HTTP ${res.status})` };
    }

    // Best-effort: proveedor sin test definido. Probamos las dos cabeceras comunes.
    const base = trim(overrideBase);
    if (!base) return { ok: false, status: 0, message: "Sin base URL: no se puede probar (la clave se guarda igual)." };
    const res = await fetchWithTimeout(base, { headers: { Authorization: `Bearer ${apiKey}`, "x-api-key": apiKey } });
    const ok = res.status !== 401 && res.status !== 403 && res.status < 500;
    return { ok, status: res.status, message: ok ? `Alcanzable (HTTP ${res.status}) — prueba básica` : `Respuesta HTTP ${res.status}` };
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError" ? "Timeout (10s) al conectar" : (e instanceof Error ? e.message : "Error de red");
    return { ok: false, status: 0, message: msg };
  }
}

/**
 * POST /api/integrations/test
 * Body: { provider, api_key?, base_url? }
 * Si se manda api_key, prueba esa (sin guardar). Si no, usa la clave guardada.
 */
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const provider = String(body.provider ?? "").trim().toLowerCase();
  if (!provider) return NextResponse.json({ ok: false, message: "Proveedor requerido" }, { status: 400 });

  let apiKey = body.api_key ? String(body.api_key).trim() : "";
  let baseUrl = body.base_url ? String(body.base_url).trim() : "";

  // Sin clave en el body → usar la guardada (BD → fallback env).
  if (!apiKey) {
    const integ = await getIntegration(provider);
    if (!integ?.apiKey) {
      return NextResponse.json({ ok: false, status: 0, message: "Sin clave configurada para este proveedor." });
    }
    apiKey = integ.apiKey;
    if (!baseUrl) baseUrl = integ.baseUrl ?? "";
  }

  const result = await testProvider(provider, apiKey, baseUrl);
  return NextResponse.json(result);
}
