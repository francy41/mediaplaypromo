"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ADMIN_CREDENTIALS } from "./auth";
import { createSupabaseBrowserClient } from "./supabase/client";

export type AuthUser = {
  id?: string;
  email: string;
  name: string;
  role: "superadmin" | "admin" | "user" | "seller" | "agency" | "affiliate";
  avatar: string;
  plan: string;
};

type AuthResult = { ok: boolean; error?: string };

type AuthContextType = {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, name?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  isLoading: boolean;
  /** true si Supabase está configurado (auth real activo) */
  supabaseEnabled: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_KEY = "mpp_session";

// ¿Hay claves de Supabase? Si sí, usamos auth real.
const SUPABASE_ENABLED =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

const ADMIN_EMAIL = ADMIN_CREDENTIALS.email.toLowerCase();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ─────────────────────────────────────────────
     Construye un AuthUser a partir de la sesión Supabase + perfil
     ───────────────────────────────────────────── */
  const buildUserFromSupabase = useCallback(async (supabase: ReturnType<typeof createSupabaseBrowserClient>, sbUser: { id: string; email?: string }): Promise<AuthUser> => {
    const email = sbUser.email ?? "";
    let role: AuthUser["role"] = email.toLowerCase() === ADMIN_EMAIL ? "superadmin" : "user";
    let plan = "free";
    let name = email.split("@")[0];

    // Intenta leer el perfil (tabla profiles). Si no existe aún, usa defaults.
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role, plan, name")
        .eq("id", sbUser.id)
        .single();
      if (data) {
        role = (data.role as AuthUser["role"]) ?? role;
        plan = (data.plan as string) ?? plan;
        name = (data.name as string) ?? name;
      }
    } catch {
      // tabla profiles no migrada todavía — usar defaults
    }

    // El email admin SIEMPRE es superadmin (failsafe)
    if (email.toLowerCase() === ADMIN_EMAIL) role = "superadmin";

    return {
      id: sbUser.id,
      email,
      name,
      role,
      avatar: name.slice(0, 2).toUpperCase(),
      plan,
    };
  }, []);

  /* ─────────────────────────────────────────────
     Restaurar sesión al montar
     ───────────────────────────────────────────── */
  useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      if (SUPABASE_ENABLED) {
        try {
          const supabase = createSupabaseBrowserClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(await buildUserFromSupabase(supabase, session.user));
          }
          // Suscribirse a cambios de sesión
          const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              setUser(await buildUserFromSupabase(supabase, session.user));
            } else {
              setUser(null);
            }
          });
          unsub = () => sub.subscription.unsubscribe();
        } catch (e) {
          console.error("Supabase session error:", e);
        }
      } else {
        // Modo mock: leer sesión de localStorage
        try {
          const stored = localStorage.getItem(SESSION_KEY);
          if (stored) setUser(JSON.parse(stored));
        } catch {}
      }
      setIsLoading(false);
    })();

    return () => { if (unsub) unsub(); };
  }, [buildUserFromSupabase]);

  /* ─────────────────────────────────────────────
     LOGIN
     ───────────────────────────────────────────── */
  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const normalizedEmail = email.trim().toLowerCase();

    if (SUPABASE_ENABLED) {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) return { ok: false, error: traducirError(error.message) };
        if (data.user) {
          setUser(await buildUserFromSupabase(supabase, data.user));
          return { ok: true };
        }
        return { ok: false, error: "No se pudo iniciar sesión." };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error de conexión." };
      }
    }

    // ── Modo mock (sin Supabase): solo admin hardcoded ──
    if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_CREDENTIALS.password) {
      const authUser: AuthUser = {
        email: ADMIN_CREDENTIALS.email,
        name: ADMIN_CREDENTIALS.name,
        role: ADMIN_CREDENTIALS.role,
        avatar: ADMIN_CREDENTIALS.avatar,
        plan: ADMIN_CREDENTIALS.plan,
      };
      setUser(authUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      return { ok: true };
    }
    return { ok: false, error: "Email o contraseña incorrectos." };
  }, [buildUserFromSupabase]);

  /* ─────────────────────────────────────────────
     REGISTER
     ───────────────────────────────────────────── */
  const register = useCallback(async (email: string, password: string, name?: string): Promise<AuthResult> => {
    const normalizedEmail = email.trim().toLowerCase();

    if (SUPABASE_ENABLED) {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { name: name ?? normalizedEmail.split("@")[0] },
            emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
          },
        });
        if (error) return { ok: false, error: traducirError(error.message) };
        // Si el proyecto exige confirmación por email, data.session será null
        if (data.user && !data.session) {
          return { ok: true, error: "Revisa tu email para confirmar la cuenta." };
        }
        if (data.user) {
          setUser(await buildUserFromSupabase(supabase, data.user));
          return { ok: true };
        }
        return { ok: false, error: "No se pudo crear la cuenta." };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error de conexión." };
      }
    }

    return { ok: false, error: "El registro estará disponible cuando se conecte Supabase." };
  }, [buildUserFromSupabase]);

  /* ─────────────────────────────────────────────
     LOGOUT
     ───────────────────────────────────────────── */
  const logout = useCallback(async () => {
    if (SUPABASE_ENABLED) {
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
      } catch {}
    }
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, supabaseEnabled: SUPABASE_ENABLED }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Traduce mensajes de error comunes de Supabase al español */
function traducirError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Confirma tu email antes de iniciar sesión.";
  if (m.includes("user already registered")) return "Ese email ya tiene cuenta. Inicia sesión.";
  if (m.includes("password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
  if (m.includes("rate limit")) return "Demasiados intentos. Espera un momento.";
  return msg;
}
