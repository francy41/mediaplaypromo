"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Edit3, Trash2, X, Save, Eye, EyeOff, Crown, Upload, Layers, Sparkles } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  DEFAULT_PRODUCTS, PRODUCTS, PRODUCTS_STORAGE_KEY,
  getOverriddenProducts, loadProductOverrides,
  type Product, type ProductOverride,
} from "@/lib/products";
import { CATEGORIES } from "@/lib/categories";

/* ─── Tipos del borrador (texto editable) ─── */
interface SubDraft { name: string; description: string; features: string }
interface PriceDraft {
  id: string; name: string; description: string; price: number; originalPrice: string;
  periodLabel: string; badge: string; cta: string; features: string;
}
interface LifetimeDraft {
  enabled: boolean; name: string; description: string; price: number; originalPrice: string;
  periodLabel: string; badge: string; cta: string; features: string;
}
interface ProductDraft {
  id: string; slug: string; categorySlug: string;
  name: string; version: string; tagline: string; cardDescription: string; longDescription: string;
  coverImage: string; downloadUrl: string; author: string;
  premium: boolean; enabled: boolean; salesCount: number; order: number;
  subProducts: SubDraft[]; prices: PriceDraft[]; lifetime: LifetimeDraft;
}

const linesToArr = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const arrToLines = (a?: string[]) => (a ?? []).join("\n");
const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

function productToDraft(p: Product): ProductDraft {
  return {
    id: p.id, slug: p.slug, categorySlug: p.categorySlug,
    name: p.name, version: p.version ?? "", tagline: p.tagline,
    cardDescription: p.cardDescription ?? "", longDescription: p.longDescription ?? "",
    coverImage: p.coverImage ?? "", downloadUrl: p.downloadUrl ?? "", author: p.author ?? "",
    premium: p.premium ?? false, enabled: p.enabled, salesCount: p.salesCount ?? 0, order: p.order ?? 99,
    subProducts: (p.subProducts ?? []).map((sp) => ({ name: sp.name, description: sp.description, features: arrToLines(sp.features) })),
    prices: p.prices.map((pr) => ({
      id: pr.id, name: pr.name, description: pr.description, price: pr.price,
      originalPrice: pr.originalPrice != null ? String(pr.originalPrice) : "",
      periodLabel: pr.periodLabel, badge: pr.badge ?? "", cta: pr.cta, features: arrToLines(pr.features),
    })),
    lifetime: {
      enabled: !!p.lifetimeOffer,
      name: p.lifetimeOffer?.name ?? "Licencia Lifetime (Pago Único)",
      description: p.lifetimeOffer?.description ?? "Acceso de por vida. Limitado a los primeros 50 usuarios.",
      price: p.lifetimeOffer?.price ?? 19.99,
      originalPrice: p.lifetimeOffer?.originalPrice != null ? String(p.lifetimeOffer.originalPrice) : "99",
      periodLabel: p.lifetimeOffer?.periodLabel ?? "pago único",
      badge: p.lifetimeOffer?.badge ?? "OFERTA DE LANZAMIENTO",
      cta: p.lifetimeOffer?.cta ?? "OBTENER OFERTA AHORA",
      features: arrToLines(p.lifetimeOffer?.features ?? ["Acceso de por vida — sin suscripción", "Actualizaciones incluidas", "Soporte por email"]),
    },
  };
}

function draftToOverride(d: ProductDraft): ProductOverride {
  return {
    id: d.id,
    name: d.name, version: d.version, tagline: d.tagline,
    cardDescription: d.cardDescription, longDescription: d.longDescription,
    coverImage: d.coverImage, downloadUrl: d.downloadUrl, author: d.author,
    premium: d.premium, enabled: d.enabled, salesCount: d.salesCount, order: d.order,
    subProducts: d.subProducts.map((s) => ({ name: s.name, description: s.description, features: linesToArr(s.features) })),
    prices: d.prices.map((p) => ({
      id: p.id, name: p.name, description: p.description, price: Number(p.price),
      originalPrice: numOrNull(p.originalPrice), periodLabel: p.periodLabel,
      badge: p.badge.trim() === "" ? null : p.badge, cta: p.cta, features: linesToArr(p.features),
    })),
    lifetimeOffer: d.lifetime.enabled
      ? {
          name: d.lifetime.name, description: d.lifetime.description, price: Number(d.lifetime.price),
          originalPrice: numOrNull(d.lifetime.originalPrice), periodLabel: d.lifetime.periodLabel,
          badge: d.lifetime.badge.trim() === "" ? null : d.lifetime.badge, cta: d.lifetime.cta,
          features: linesToArr(d.lifetime.features),
        }
      : null,
  };
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    setProducts(getOverriddenProducts(loadProductOverrides()));
  }, []);

  /** Persiste los overrides y refresca el catálogo en runtime */
  const persist = (overrides: ProductOverride[]) => {
    try { localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(overrides)); } catch {}
    const resolved = getOverriddenProducts(overrides);
    setProducts(resolved);
    PRODUCTS.splice(0, PRODUCTS.length, ...resolved);
  };

  const startEdit = (p: Product) => { setEditId(p.id); setDraft(productToDraft(p)); };
  const cancelEdit = () => { setEditId(null); setDraft(null); };

  const onUploadCover = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Selecciona un archivo de imagen (JPG, PNG, WebP)."); return; }
    if (file.size > 2 * 1024 * 1024) { alert("La imagen supera 2MB. Usa una más ligera o pega una URL."); return; }
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => (d ? { ...d, coverImage: String(reader.result) } : d));
    reader.readAsDataURL(file);
  };

  const saveEdit = () => {
    if (!draft) return;
    const stored = loadProductOverrides().filter((o) => o.id !== draft.id);
    persist([...stored, draftToOverride(draft)]);
    cancelEdit();
  };

  const toggleEnabled = (p: Product) => {
    const stored = loadProductOverrides();
    const existing = stored.find((o) => o.id === p.id);
    const updated: ProductOverride = existing ? { ...existing, enabled: !p.enabled } : { id: p.id, enabled: !p.enabled };
    persist([...stored.filter((o) => o.id !== p.id), updated]);
  };

  const resetAll = () => {
    if (!confirm("¿Resetear todos los productos a su valor por defecto? Se perderán tus cambios.")) return;
    try { localStorage.removeItem(PRODUCTS_STORAGE_KEY); } catch {}
    setProducts([...DEFAULT_PRODUCTS]);
    PRODUCTS.splice(0, PRODUCTS.length, ...DEFAULT_PRODUCTS);
  };

  /* helpers de actualización del borrador */
  const updateLifetime = (patch: Partial<LifetimeDraft>) =>
    setDraft((d) => (d ? { ...d, lifetime: { ...d.lifetime, ...patch } } : d));
  const updateSub = (i: number, patch: Partial<SubDraft>) =>
    setDraft((d) => (d ? { ...d, subProducts: d.subProducts.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) } : d));
  const updatePrice = (i: number, patch: Partial<PriceDraft>) =>
    setDraft((d) => (d ? { ...d, prices: d.prices.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) } : d));

  const filtered = filterCategory === "all" ? products : products.filter((p) => p.categorySlug === filterCategory);

  return (
    <AdminShell
      title="Productos / Subcategorías"
      description="Edita el catálogo: imagen, descarga, planes, herramientas y oferta de pago único. Cambios persisten en localStorage hasta integrar DB."
      icon={Package}
      iconGradient="from-violet-500 to-fuchsia-600"
      status="live"
      breadcrumb={[{ label: "Productos" }]}
      actions={
        <button onClick={resetAll} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
          Reset todo
        </button>
      }
    >
      {/* Filtro por categoría */}
      <div className="glass-card rounded-2xl border border-white/10 p-4">
        <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-2">Filtrar por categoría</label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/40"
        >
          <option value="all" className="bg-[#0f1219]">Todas las categorías ({products.length} productos)</option>
          {CATEGORIES.filter((c) => c.enabled).map((c) => {
            const count = products.filter((p) => p.categorySlug === c.slug).length;
            return <option key={c.slug} value={c.slug} className="bg-[#0f1219]">{c.title} ({count})</option>;
          })}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => {
          const category = CATEGORIES.find((c) => c.slug === p.categorySlug);
          const isEditing = editId === p.id;
          return (
            <div key={p.id} className={`glass-card rounded-2xl border ${isEditing ? "border-violet-500/40 shadow-lg shadow-violet-500/15" : "border-white/10"} overflow-hidden transition-all`}>
              {/* Header de la card */}
              <div className="flex items-start gap-4 p-4 sm:p-5 border-b border-white/8">
                <div className={`flex-shrink-0 w-16 h-20 rounded-xl bg-gradient-to-br ${p.gradient} flex flex-col items-center justify-center shadow-lg ring-1 ring-white/20 overflow-hidden`}>
                  {p.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <p className="text-white font-black text-xl">{p.shortName?.split(" ").map((s) => s[0]).join("").slice(0, 2) ?? "YF"}</p>
                      {p.version && <p className="text-white/85 text-[8px] font-bold tracking-widest">{p.version}</p>}
                    </>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-white font-bold text-base">{p.name}{p.version && <span className={`text-xs font-black ml-1.5 ${p.textAccent}`}>{p.version}</span>}</h3>
                    {p.premium && <span className="text-[9px] font-black bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full px-1.5 py-0.5">PRO</span>}
                    {p.lifetimeOffer && <span className="text-[9px] font-black bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-full px-1.5 py-0.5">LIFETIME €{p.lifetimeOffer.price}</span>}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.enabled ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-white/5 text-white/40 border border-white/10"}`}>{p.enabled ? "VISIBLE" : "OCULTO"}</span>
                  </div>
                  <p className="text-white/55 text-xs mb-1">{p.tagline}</p>
                  <p className="text-white/35 text-[11px]">
                    Categoría: <span className={category?.textAccent}>{category?.title ?? p.categorySlug}</span>
                    {p.salesCount ? ` · ${p.salesCount.toLocaleString()} ventas` : ""}
                    {p.order !== undefined ? ` · orden #${p.order}` : ""}
                  </p>
                </div>

                {!isEditing && (
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                    <Link href={`/categories/${p.categorySlug}/${p.slug}`} target="_blank" className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors">Ver</Link>
                    <button onClick={() => toggleEnabled(p)} className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors">{p.enabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                    <button onClick={() => startEdit(p)} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow shadow-violet-500/30 transition-all hover:-translate-y-0.5"><Edit3 className="w-3.5 h-3.5" /> Editar</button>
                  </div>
                )}
              </div>

              {/* ─── Formulario de edición ─── */}
              {isEditing && draft && (
                <div className="p-4 sm:p-5 space-y-5 bg-white/[0.02]">
                  {/* DATOS PRINCIPALES */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Nombre del producto"><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="adm-input" /></Field>
                    <Field label="Versión (ej: V1, V2, Beta)"><input value={draft.version} onChange={(e) => setDraft({ ...draft, version: e.target.value })} placeholder="V2" className="adm-input" /></Field>
                    <Field label="Tagline / Subtítulo" full><input value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} className="adm-input" /></Field>
                    <Field label="Descripción card (1-2 líneas)" full><textarea rows={2} value={draft.cardDescription} onChange={(e) => setDraft({ ...draft, cardDescription: e.target.value })} className="adm-input resize-none" /></Field>

                    <Field label="🖼️ Imagen del producto (portada)" full>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <label className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer shadow shadow-violet-500/30 hover:-translate-y-0.5 transition-all">
                          <Upload className="w-3.5 h-3.5" /> Subir imagen
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadCover(e.target.files?.[0])} />
                        </label>
                        {draft.coverImage && <button type="button" onClick={() => setDraft({ ...draft, coverImage: "" })} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /> Quitar</button>}
                        <span className="text-white/35 text-[10px]">o pega una URL abajo</span>
                      </div>
                      <input
                        value={draft.coverImage.startsWith("data:") ? "" : draft.coverImage}
                        onChange={(e) => setDraft({ ...draft, coverImage: e.target.value })}
                        placeholder={draft.coverImage.startsWith("data:") ? "(imagen subida desde tu equipo)" : "https://cdn.../yf-auto-clip.jpg"}
                        disabled={draft.coverImage.startsWith("data:")}
                        className="adm-input font-mono text-[11px] disabled:opacity-50"
                      />
                      {draft.coverImage && (
                        <div className="mt-2 inline-block rounded-lg overflow-hidden border border-white/15 max-w-[160px]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={draft.coverImage} alt="preview" className="w-full h-auto" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }} />
                        </div>
                      )}
                      <p className="text-white/35 text-[10px] mt-1.5">Se usa en el hero de la landing. Máx 2MB para subida directa.</p>
                    </Field>

                    <Field label="⬇️ Link de descarga (archivo / instalador)" full>
                      <input value={draft.downloadUrl} onChange={(e) => setDraft({ ...draft, downloadUrl: e.target.value })} placeholder="https://drive.google.com/... o https://tu-cdn.com/yf-auto-clip.zip" className="adm-input font-mono text-[11px]" />
                      <p className="text-white/35 text-[10px] mt-1.5">El comprador recibe este enlace tras pagar. (Como admin lo ves en la landing para verificarlo.)</p>
                    </Field>

                    <Field label="Autor / Brand"><input value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} placeholder="by YANKYFILMS" className="adm-input" /></Field>
                    <Field label="Ventas (social proof)"><input type="number" value={draft.salesCount} onChange={(e) => setDraft({ ...draft, salesCount: +e.target.value })} className="adm-input" /></Field>
                    <Field label="Orden de aparición"><input type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: +e.target.value })} className="adm-input" /></Field>
                    <Field label="Descripción larga" full><textarea rows={3} value={draft.longDescription} onChange={(e) => setDraft({ ...draft, longDescription: e.target.value })} className="adm-input resize-none" /></Field>
                    <Field label="Opciones" full>
                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer"><input type="checkbox" checked={draft.premium} onChange={(e) => setDraft({ ...draft, premium: e.target.checked })} className="w-3.5 h-3.5 accent-yellow-500" /><span className="text-white text-xs font-semibold flex items-center gap-1"><Crown className="w-3 h-3 text-yellow-400" /> Premium</span></label>
                        <label className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} className="w-3.5 h-3.5 accent-green-500" /><span className="text-white text-xs font-semibold flex items-center gap-1"><Eye className="w-3 h-3 text-green-400" /> Visible públicamente</span></label>
                      </div>
                    </Field>
                  </div>

                  {/* ─── OFERTA DE PAGO ÚNICO (LIFETIME) ─── */}
                  <div className="rounded-2xl border border-pink-500/30 bg-pink-500/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="flex items-center gap-2 text-white font-bold text-sm"><Sparkles className="w-4 h-4 text-pink-400" /> Oferta de pago único (Lifetime)</h4>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={draft.lifetime.enabled} onChange={(e) => updateLifetime({ enabled: e.target.checked })} className="w-4 h-4 accent-pink-500" />
                        <span className="text-pink-300 text-xs font-bold">{draft.lifetime.enabled ? "Activada" : "Desactivada"}</span>
                      </label>
                    </div>
                    {draft.lifetime.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Título" full><input value={draft.lifetime.name} onChange={(e) => updateLifetime({ name: e.target.value })} className="adm-input" /></Field>
                        <Field label="Descripción" full><textarea rows={2} value={draft.lifetime.description} onChange={(e) => updateLifetime({ description: e.target.value })} className="adm-input resize-none" /></Field>
                        <Field label="Precio (€)"><input type="number" step="0.01" value={draft.lifetime.price} onChange={(e) => updateLifetime({ price: +e.target.value })} className="adm-input" /></Field>
                        <Field label="Precio tachado (€, opcional)"><input value={draft.lifetime.originalPrice} onChange={(e) => updateLifetime({ originalPrice: e.target.value })} placeholder="99" className="adm-input" /></Field>
                        <Field label="Etiqueta periodo"><input value={draft.lifetime.periodLabel} onChange={(e) => updateLifetime({ periodLabel: e.target.value })} placeholder="pago único" className="adm-input" /></Field>
                        <Field label="Badge (opcional)"><input value={draft.lifetime.badge} onChange={(e) => updateLifetime({ badge: e.target.value })} placeholder="OFERTA DE LANZAMIENTO" className="adm-input" /></Field>
                        <Field label="Texto del botón (CTA)" full><input value={draft.lifetime.cta} onChange={(e) => updateLifetime({ cta: e.target.value })} className="adm-input" /></Field>
                        <Field label="Características (una por línea)" full><textarea rows={4} value={draft.lifetime.features} onChange={(e) => updateLifetime({ features: e.target.value })} className="adm-input resize-none font-mono text-[11px]" /></Field>
                      </div>
                    )}
                  </div>

                  {/* ─── HERRAMIENTAS / SUB-PRODUCTOS ─── */}
                  {draft.subProducts.length > 0 && (
                    <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.03] p-4 space-y-4">
                      <h4 className="flex items-center gap-2 text-white font-bold text-sm"><Layers className="w-4 h-4 text-cyan-400" /> Herramientas del producto ({draft.subProducts.length})</h4>
                      {draft.subProducts.map((sp, i) => (
                        <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field label={`Herramienta #${i + 1} · Nombre`}><input value={sp.name} onChange={(e) => updateSub(i, { name: e.target.value })} className="adm-input" /></Field>
                          <Field label="Descripción"><input value={sp.description} onChange={(e) => updateSub(i, { description: e.target.value })} className="adm-input" /></Field>
                          <Field label="Características (una por línea)" full><textarea rows={4} value={sp.features} onChange={(e) => updateSub(i, { features: e.target.value })} className="adm-input resize-none font-mono text-[11px]" /></Field>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ─── PLANES DE PRECIO ─── */}
                  <div className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.03] p-4 space-y-4">
                    <h4 className="flex items-center gap-2 text-white font-bold text-sm"><Package className="w-4 h-4 text-violet-400" /> Planes de precio ({draft.prices.length})</h4>
                    {draft.prices.map((pr, i) => (
                      <div key={pr.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label={`Plan #${i + 1} · Nombre`}><input value={pr.name} onChange={(e) => updatePrice(i, { name: e.target.value })} className="adm-input" /></Field>
                        <Field label="Descripción"><input value={pr.description} onChange={(e) => updatePrice(i, { description: e.target.value })} className="adm-input" /></Field>
                        <Field label="Precio (€)"><input type="number" step="0.01" value={pr.price} onChange={(e) => updatePrice(i, { price: +e.target.value })} className="adm-input" /></Field>
                        <Field label="Precio tachado (€, opcional)"><input value={pr.originalPrice} onChange={(e) => updatePrice(i, { originalPrice: e.target.value })} className="adm-input" /></Field>
                        <Field label="Etiqueta periodo"><input value={pr.periodLabel} onChange={(e) => updatePrice(i, { periodLabel: e.target.value })} placeholder="/mes" className="adm-input" /></Field>
                        <Field label="Badge (opcional)"><input value={pr.badge} onChange={(e) => updatePrice(i, { badge: e.target.value })} placeholder="MÁS POPULAR" className="adm-input" /></Field>
                        <Field label="Texto del botón (CTA)" full><input value={pr.cta} onChange={(e) => updatePrice(i, { cta: e.target.value })} className="adm-input" /></Field>
                        <Field label="Características (una por línea)" full><textarea rows={5} value={pr.features} onChange={(e) => updatePrice(i, { features: e.target.value })} className="adm-input resize-none font-mono text-[11px]" /></Field>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button onClick={cancelEdit} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"><X className="w-3.5 h-3.5" /> Cancelar</button>
                    <button onClick={saveEdit} className="shine-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold px-5 py-2 rounded-lg shadow-lg shadow-violet-500/30 transition-all"><Save className="w-3.5 h-3.5" /> Guardar cambios</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="glass-card rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <Package className="w-10 h-10 text-white/30 mx-auto mb-3" />
            <p className="text-white/50 text-sm">No hay productos en esta categoría.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.adm-input) {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 0.625rem;
          padding: 0.55rem 0.75rem;
          color: white;
          font-size: 0.8rem;
          outline: none;
          transition: border-color 0.15s;
        }
        :global(.adm-input:focus) { border-color: rgba(168, 85, 247, 0.5); }
      `}</style>
    </AdminShell>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}
