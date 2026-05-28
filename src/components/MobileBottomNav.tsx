"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, LogIn, UserPlus, LayoutDashboard, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface Props {
  onOpenCategories?: () => void;
  variant?: "public" | "dashboard";
}

/**
 * Floating bottom nav for mobile.
 * Hidden on lg+ screens. Pinned to bottom with safe-area inset.
 */
export function MobileBottomNav({ onOpenCategories, variant = "public" }: Props) {
  const pathname = usePathname();
  const { user } = useAuth();

  const items =
    variant === "dashboard"
      ? [
          { label: "Inicio", icon: Home, href: "/" },
          { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
          { label: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
          { label: "Cuenta", icon: UserPlus, href: "/settings" },
        ]
      : user
      ? [
          { label: "Inicio", icon: Home, href: "/" },
          { label: "Categorías", icon: LayoutGrid, onClick: onOpenCategories },
          { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
          { label: "Cuenta", icon: UserPlus, href: "/settings" },
        ]
      : [
          { label: "Inicio", icon: Home, href: "/" },
          { label: "Categorías", icon: LayoutGrid, onClick: onOpenCategories },
          { label: "Entrar", icon: LogIn, href: "/login" },
          { label: "Registro", icon: UserPlus, href: "/register" },
        ];

  return (
    <>
      {/* Spacer so content isn't hidden behind */}
      <div className="lg:hidden h-20" aria-hidden />

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0) + 8px)" }}
      >
        <div className="glass-card rounded-2xl border border-white/10 px-2 py-2 flex items-center justify-around shadow-2xl shadow-black/40">
          {items.map((item, i) => {
            const Icon = item.icon;
            const active = item.href ? (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) : false;
            const className = cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[58px]",
              active ? "text-cyan-400 bg-cyan-500/10" : "text-white/55 hover:text-white"
            );
            const content = (
              <>
                <Icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} />
                <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
              </>
            );

            if (item.onClick) {
              return (
                <button key={i} onClick={item.onClick} className={className} aria-label={item.label}>
                  {content}
                </button>
              );
            }
            return (
              <Link key={i} href={item.href ?? "/"} className={className}>
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
