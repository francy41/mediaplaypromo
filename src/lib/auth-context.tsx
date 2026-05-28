"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { ADMIN_CREDENTIALS } from "./auth";

export type AuthUser = {
  email: string;
  name: string;
  role: "superadmin" | "admin" | "user";
  avatar: string;
  plan: string;
};

type AuthContextType = {
  user: AuthUser | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "mpp_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedEmail === ADMIN_CREDENTIALS.email.toLowerCase() &&
      password === ADMIN_CREDENTIALS.password
    ) {
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
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
