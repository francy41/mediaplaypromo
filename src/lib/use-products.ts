"use client";
import { useEffect, useState } from "react";
import { DEFAULT_PRODUCTS, resolveProducts, type Product } from "./products";

/**
 * Devuelve el catálogo con los overrides del admin aplicados.
 * En el primer render usa DEFAULT_PRODUCTS (coincide con el SSR, sin mismatch);
 * tras montar, aplica lo guardado en localStorage.
 */
export function useResolvedProducts(): Product[] {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  useEffect(() => {
    setProducts(resolveProducts());
  }, []);
  return products;
}

/** Un producto concreto (con overrides) por categoría + slug */
export function useResolvedProduct(categorySlug: string, productSlug: string): Product | undefined {
  const products = useResolvedProducts();
  return products.find((p) => p.categorySlug === categorySlug && p.slug === productSlug);
}
