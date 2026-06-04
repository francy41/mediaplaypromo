"use client";
import { SOCIAL_LINKS } from "@/lib/social";

/** Iconos SVG inline de cada red (sin dependencias) */
const ICONS: Record<string, React.ReactNode> = {
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.42.6.22 1 .48 1.4.9.43.43.7.83.92 1.42.17.4.36 1 .42 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.25 1.8-.42 2.2a3.9 3.9 0 0 1-.92 1.42c-.43.43-.83.7-1.42.92-.4.17-1 .36-2.2.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-1.8-.25-2.2-.42a3.9 3.9 0 0 1-1.42-.92 3.9 3.9 0 0 1-.92-1.42c-.17-.4-.36-1-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.06-1.2.25-1.8.42-2.2.22-.6.48-1 .92-1.42.43-.43.83-.7 1.42-.92.4-.17 1-.36 2.2-.42C8.4 2.2 8.8 2.2 12 2.2zm0 3.5a6.3 6.3 0 1 0 0 12.6 6.3 6.3 0 0 0 0-12.6zm0 10.4a4.1 4.1 0 1 1 0-8.2 4.1 4.1 0 0 1 0 8.2zm6.4-10.6a1.47 1.47 0 1 1-2.94 0 1.47 1.47 0 0 1 2.94 0z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.23 2.7.23v2.9h-1.5c-1.5 0-2 .93-2 1.9V12h3.3l-.53 3.5h-2.8v8.4A12 12 0 0 0 24 12z" />
    </svg>
  ),
};

interface Props {
  /** "footer" = compacto en fila · "buttons" = botones con label */
  variant?: "footer" | "buttons";
  className?: string;
}

export function SocialLinks({ variant = "footer", className = "" }: Props) {
  if (variant === "buttons") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {SOCIAL_LINKS.map((s) => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-3.5 py-2 text-white/75 hover:text-white text-sm font-semibold transition-all hover:-translate-y-0.5"
          >
            <span className="w-4 h-4">{ICONS[s.id]}</span>
            {s.label}
          </a>
        ))}
      </div>
    );
  }

  // footer compacto
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {SOCIAL_LINKS.map((s) => (
        <a
          key={s.id}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          title={s.label}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/12 border border-white/10 flex items-center justify-center text-white/55 hover:text-white transition-all hover:-translate-y-0.5"
        >
          <span className="w-4 h-4">{ICONS[s.id]}</span>
        </a>
      ))}
    </div>
  );
}
