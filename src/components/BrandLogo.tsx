/**
 * Logo de marca MediaPlayPromo — icono SVG vectorial (bowtie + red neuronal + play).
 * Uso: <BrandLogo className="w-9 h-9" /> o con texto <BrandLogo withText />
 */
export function BrandLogo({ className = "w-9 h-9", withText = false }: { className?: string; withText?: boolean }) {
  const mark = (
    <svg viewBox="0 0 64 64" className={className} aria-label="MediaPlayPromo">
      <defs>
        <linearGradient id="bl-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b5bdb" /><stop offset="100%" stopColor="#5c7cfa" />
        </linearGradient>
        <linearGradient id="bl-red" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8590c" /><stop offset="100%" stopColor="#f03e3e" />
        </linearGradient>
        <linearGradient id="bl-navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a2b4a" /><stop offset="100%" stopColor="#16213e" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#bl-navy)" />
      <path d="M14 18 L30 32 L14 46 Z" fill="none" stroke="url(#bl-blue)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M50 18 L34 32 L50 46 Z" fill="none" stroke="url(#bl-red)" strokeWidth="2.5" strokeLinejoin="round" />
      <g fill="#5c7cfa">
        <circle cx="20" cy="26" r="1.6" /><circle cx="24" cy="32" r="2" /><circle cx="20" cy="38" r="1.6" /><circle cx="26" cy="29" r="1.3" />
      </g>
      <g stroke="#5c7cfa" strokeWidth="0.8" opacity="0.7">
        <line x1="20" y1="26" x2="24" y2="32" /><line x1="24" y1="32" x2="20" y2="38" /><line x1="24" y1="32" x2="26" y2="29" />
      </g>
      <g fill="#ff8787">
        <circle cx="44" cy="26" r="1.6" /><circle cx="40" cy="32" r="2" /><circle cx="44" cy="38" r="1.6" /><circle cx="38" cy="29" r="1.3" />
      </g>
      <g stroke="#ff8787" strokeWidth="0.8" opacity="0.7">
        <line x1="44" y1="26" x2="40" y2="32" /><line x1="40" y1="32" x2="44" y2="38" /><line x1="40" y1="32" x2="38" y2="29" />
      </g>
      <path d="M29.5 25 L38 32 L29.5 39 Z" fill="#7048e8" />
    </svg>
  );

  if (!withText) return mark;

  return (
    <span className="inline-flex items-center gap-2.5">
      {mark}
      <span className="leading-none">
        <span className="block text-white font-black text-sm tracking-wide">MediaPlay<span className="font-medium">Promo</span></span>
      </span>
    </span>
  );
}
