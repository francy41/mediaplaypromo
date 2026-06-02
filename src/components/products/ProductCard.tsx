"use client";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import type { Product } from "@/lib/products";

interface Props {
  product: Product;
  categorySlug: string;
}

/**
 * Card de producto/subcategoría usada en el grid 4-cols de cada categoría.
 * Estilo similar al menú del homepage con cover + nombre + version + descripción + counter.
 */
export function ProductCard({ product, categorySlug }: Props) {
  const Icon = product.cardIcon;
  const href = `/categories/${categorySlug}/${product.slug}`;

  return (
    <Link
      href={href}
      className="glass-card hover-lift group flex flex-col items-center gap-2 sm:gap-3 rounded-2xl p-2.5 sm:p-5 relative overflow-hidden"
    >
      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${product.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none`} />
      {/* Glow orb on hover */}
      <div className={`absolute -top-8 -right-8 w-28 h-28 bg-gradient-to-br ${product.gradient} opacity-0 group-hover:opacity-30 rounded-full blur-3xl transition-opacity duration-500 pointer-events-none`} />

      {/* Premium badge */}
      {product.premium && (
        <span className="absolute top-2 right-2 z-10 text-[8px] font-black bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full px-1.5 py-0.5 shadow-lg shadow-orange-500/40">
          PRO
        </span>
      )}

      {/* Version badge (esquina superior izquierda) */}
      {product.version && (
        <span className={`absolute top-2 left-2 z-10 text-[9px] font-black bg-black/50 backdrop-blur border border-white/15 ${product.textAccent} rounded-full px-2 py-0.5`}>
          {product.version}
        </span>
      )}

      {/* Cover image O Box visual 3D auto */}
      {product.coverImage ? (
        <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden ring-1 ring-white/15 shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.coverImage} alt={product.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="relative w-full aspect-[3/4] mt-2">
          <div className={`relative w-full h-full rounded-2xl bg-gradient-to-br ${product.gradient} flex flex-col items-center justify-between p-3 shadow-xl ring-1 ring-white/20 overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
            {/* Top brand */}
            <div className="relative text-center">
              <p className="text-white/70 text-[8px] font-bold tracking-[0.2em] uppercase">{product.author?.replace(/^by /, "") ?? "MEDIAPLAY"}</p>
            </div>
            {/* Center logo */}
            <div className="relative text-center">
              {Icon ? (
                <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-2xl mx-auto mb-1" />
              ) : (
                <>
                  <p className="text-white font-black text-3xl sm:text-4xl tracking-tighter drop-shadow-2xl">
                    {product.shortName?.split(" ").slice(0, 2).map((s) => s[0]).join("") ?? "YF"}
                  </p>
                </>
              )}
              <p className="text-white/85 text-[8px] font-bold tracking-[0.25em] uppercase mt-1">{product.shortName ?? product.name}</p>
            </div>
            {/* Bottom badge */}
            {product.subProducts && product.subProducts.length > 0 && (
              <div className="relative w-full bg-black/40 backdrop-blur border border-white/30 rounded-md py-1 text-center">
                <p className="text-white text-[7px] font-black tracking-widest uppercase truncate px-1">
                  {product.subProducts.length} herramientas
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nombre + versión inline */}
      <div className="relative z-10 text-center w-full">
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5">
          <h3 className="text-white font-bold text-xs sm:text-sm leading-tight truncate">{product.name}</h3>
          {product.version && (
            <span className={`text-[8px] sm:text-[9px] font-black ${product.textAccent} bg-white/5 rounded px-1 sm:px-1.5`}>
              {product.version}
            </span>
          )}
        </div>
        <p className="text-white/45 text-[9px] sm:text-[10px] leading-tight line-clamp-2 min-h-[1.6em]">
          {product.cardDescription ?? product.tagline}
        </p>
      </div>

      {/* Footer: ventas + price preview */}
      <div className="relative z-10 w-full pt-1.5 sm:pt-2 mt-auto border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-0.5 sm:gap-0 text-[9px] sm:text-[10px]">
        {product.salesCount && (
          <span className="inline-flex items-center gap-1 text-white/45 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {product.salesCount >= 1000 ? `${(product.salesCount / 1000).toFixed(1)}k` : product.salesCount}
          </span>
        )}
        <span className={`font-bold ${product.textAccent} flex items-center gap-0.5 whitespace-nowrap`}>
          €{Math.min(...product.prices.map((p) => p.monthlyEquivalent ?? p.price)).toFixed(0)}/mes
          <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline" />
        </span>
      </div>
    </Link>
  );
}
