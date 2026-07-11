import { ADMIN_CREDENTIALS } from "@/lib/auth";

/**
 * Obtiene el secreto de admin para las herramientas SuperAdmin SIN pedir la clave.
 *  - Si ya está en localStorage, lo devuelve.
 *  - Si hay sesión de SuperAdmin en el dashboard (mpp_session), lo pide solo al
 *    servidor con las credenciales del admin y lo cachea. Así el editor, las
 *    miniaturas, etc. no muestran el candado.
 * Devuelve "" si no hay forma de autenticar (entonces la página muestra el login).
 */
const SECRET_STORE = "mpp_license_admin_secret";
const SESSION_KEY = "mpp_session";

export async function ensureAdminSecret(): Promise<string> {
  if (typeof window === "undefined") return "";
  let s = ""; try { s = localStorage.getItem(SECRET_STORE) ?? ""; } catch {}
  if (s) return s;

  // ¿El usuario entró al dashboard como SuperAdmin? Solo entonces lo resolvemos.
  let isSuper = false;
  try {
    const sess = JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as { role?: string } | null;
    isSuper = sess?.role === "superadmin";
  } catch {}
  if (!isSuper) return "";

  try {
    const r = await fetch("/api/planner-auth", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password }),
    });
    if (r.ok) {
      const d = await r.json();
      if (d.ok && d.token) { try { localStorage.setItem(SECRET_STORE, d.token); } catch {} return d.token as string; }
    }
  } catch {}
  return "";
}
