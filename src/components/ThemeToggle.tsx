"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export function ThemeToggle({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className={
        compact
          ? `relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all theme-toggle-btn ${className}`
          : `relative inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/75 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all theme-toggle-btn ${className}`
      }
    >
      {isDark ? (
        <Sun className={compact ? "w-4 h-4 text-yellow-300" : "w-3.5 h-3.5 text-yellow-300"} />
      ) : (
        <Moon className={compact ? "w-4 h-4 text-indigo-400" : "w-3.5 h-3.5 text-indigo-500"} />
      )}
      {!compact && <span>{isDark ? "Claro" : "Oscuro"}</span>}
    </button>
  );
}
