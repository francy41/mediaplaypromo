"use client";
import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { getCategoryBySlug } from "@/lib/categories";
import { useResolvedProducts } from "@/lib/use-products";
import { ProductShowcase } from "@/components/products/ProductShowcase";
import { ProductLandingPro } from "@/components/products/ProductLandingPro";

interface PageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { slug, productSlug } = use(params);
  const category = getCategoryBySlug(slug);
  const products = useResolvedProducts();
  const product = products.find((p) => p.categorySlug === slug && p.slug === productSlug);

  if (!category || !product) notFound();

  const relatedProducts = products
    .filter((p) => p.categorySlug === slug && p.enabled && p.id !== product.id)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs flex-wrap">
        <Link href="/" className="text-white/45 hover:text-white transition-colors">Inicio</Link>
        <ChevronRight className="w-3 h-3 text-white/25" />
        <Link href="/#categories" className="text-white/45 hover:text-white transition-colors">Categorías</Link>
        <ChevronRight className="w-3 h-3 text-white/25" />
        <Link href={`/categories/${slug}`} className="text-white/45 hover:text-white transition-colors">{category.title}</Link>
        <ChevronRight className="w-3 h-3 text-white/25" />
        <span className={`font-bold ${product.textAccent}`}>
          {product.name} {product.version && <span className="opacity-65">{product.version}</span>}
        </span>
      </nav>

      {/* Back link */}
      <Link
        href={`/categories/${slug}`}
        className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-semibold transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Ver todos los productos de {category.title}
      </Link>

      {/* LANDING DE VENTAS (pro) o SHOWCASE estándar */}
      {product.landingStyle === "pro"
        ? <ProductLandingPro product={product} />
        : <ProductShowcase product={product} />}

      {/* Productos relacionados */}
      {relatedProducts.length > 0 && (
        <div className="pt-4 border-t border-white/8">
          <h3 className="text-white font-bold text-base mb-4">Otros productos en {category.title}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {relatedProducts.map((p) => (
              <Link
                key={p.id}
                href={`/categories/${slug}/${p.slug}`}
                className={`glass-card hover-lift rounded-2xl border ${p.borderColor} p-4 text-center group`}
              >
                <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${p.gradient} flex items-center justify-center shadow-lg mb-3 ring-1 ring-white/15`}>
                  {p.cardIcon ? (
                    <p.cardIcon className="w-6 h-6 text-white" />
                  ) : (
                    <span className="text-white font-black text-sm">{p.version ?? "★"}</span>
                  )}
                </div>
                <p className="text-white font-bold text-xs">
                  {p.name} {p.version && <span className={p.textAccent}>{p.version}</span>}
                </p>
                <p className={`text-[10px] mt-1 ${p.textAccent}`}>
                  desde €{Math.min(...p.prices.map((pr) => pr.monthlyEquivalent ?? pr.price)).toFixed(0)}/mes
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
