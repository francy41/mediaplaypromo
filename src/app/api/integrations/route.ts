import { NextRequest, NextResponse } from "next/server";
import { readAllIntegrations, writeAllIntegrations, type StoredIntegration } from "@/lib/integrations";

export const runtime = "nodejs";

function authed(req: NextRequest): boolean {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

/** Enmascara la clave: muestra solo los primeros/últimos caracteres. */
function mask(k?: string | null): string | null {
  if (!k) return null;
  if (k.length <= 8) return "••••";
  return `${k.slice(0, 4)}••••${k.slice(-4)}`;
}

/** GET /api/integrations — lista proveedores (claves enmascaradas, nunca en claro). */
export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const list = await readAllIntegrations();
    const integrations = list
      .sort((a, b) => a.provider.localeCompare(b.provider))
      .map((r) => ({
        provider: r.provider,
        label: r.label,
        base_url: r.base_url,
        enabled: r.enabled,
        updated_at: r.updated_at,
        api_key_masked: mask(r.api_key),
        has_key: !!r.api_key,
      }));
    return NextResponse.json({ integrations });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error", integrations: [] }, { status: 500 });
  }
}

/** POST /api/integrations — crear/actualizar o borrar un proveedor. */
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const list = await readAllIntegrations();

  if (body.action === "delete") {
    const target = String(body.provider ?? "").toLowerCase();
    const res = await writeAllIntegrations(list.filter((i) => i.provider !== target));
    return NextResponse.json({ ok: res.ok, error: res.error });
  }

  const provider = String(body.provider ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!provider) return NextResponse.json({ error: "Proveedor inválido (solo letras, números, - y _)" }, { status: 400 });

  const existing = list.find((i) => i.provider === provider);
  const updated: StoredIntegration = {
    provider,
    label: body.label ? String(body.label).trim() : (existing?.label ?? null),
    base_url: body.base_url ? String(body.base_url).trim() : (existing?.base_url ?? null),
    enabled: body.enabled !== false,
    // Solo sobreescribimos la clave si mandan una nueva (editar label/url no la borra).
    api_key: (body.api_key && String(body.api_key).trim()) ? String(body.api_key).trim() : (existing?.api_key ?? null),
    updated_at: new Date().toISOString(),
  };
  const next = existing ? list.map((i) => (i.provider === provider ? updated : i)) : [...list, updated];
  const res = await writeAllIntegrations(next);
  return NextResponse.json({ ok: res.ok, provider, error: res.error });
}
