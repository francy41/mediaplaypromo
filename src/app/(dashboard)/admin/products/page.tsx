"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Plus, Edit3, Trash2, X, Save, Eye, EyeOff, Crown, ImageIcon as Img, Upload } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DEFAULT_PRODUCTS, PRODUCTS, type Product } from "@/lib/products";
import { CATEGORIES } from "@/lib/categories";

const STORAGE_KEY = "mpp_products_v1";

interface ProductDraft {
  id: string;
  slug: string;
  categorySlug: string;
  name: string;
  version: string;
  tagline: string;
  cardDescription: string;
  longDescription: string;
  coverImage: string;
  downloadUrl: string;
  author: string;
  premium: boolean;
  enabled: boolean;
  salesCount: number;
  order: number;
}

function productToDraft(p: Product): ProductDraft {
  return {
    id: p.id,
    slug: p.slug,
    categorySlug: p.categorySlug,
    name: p.name,
    version: p.version ?? "",
    tagline: p.tagline,
    cardDescription: p.cardDescription ?? "",
    longDescription: p.longDescription ?? "",
    coverImage: p.coverImage ?? "",
    downloadUrl: p.downloadUrl ?? "",
    author: p.author ?? "",
    premium: p.premium ?? false,
    enabled: p.enabled,
    salesCount: p.salesCount ?? 0,
    order: p.order ?? 99,
  };
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Cargar de localStorage o DEFAULTS
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const overrides = JSON.parse(raw) as Partial<Product>[];
        // Aplicar overrides sobre DEFAULT_PRODUCTS
        const merged = DEFAULT_PRODUCTS.map((d) => {
          const ov = overrides.find((o) => o.id === d.id);
          return ov ? { ...d, ...ov } : d;
        });
        setProducts(merged);
        return;
      }
    } catch {}
    setProducts([...DEFAULT_PRODUCTS]);
  }, []);

  const saveOverrides = (next: Product[]) => {
    // Solo guardamos los campos editables (no sub-products, ni prices que tienen estructura compleja)
    const overrides = next.map((p) => ({
      id: p.id,
      name: p.name,
      version: p.version,
      tagline: p.tagline,
      cardDescription: p.cardDescription,
      longDescription: p.longDescription,
      coverImage: p.coverImage,
      downloadUrl: p.downloadUrl,
      author: p.author,
      premium: p.premium,
      enabled: p.enabled,
      salesCount: p.salesCount,
      order: p.order,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    // Mutate también el runtime PRODUCTS para que el front lo refleje inmediato
    PRODUCTS.splice(0, PRODUCTS.length, ...next);
  };

  const startEdit = (p: Product) => {
    setEditId(p.id);
    setDraft(productToDraft(p));
  };

  /** Sube una imagen desde el equipo y la guarda como data URL en el borrador */
  const onUploadCover = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Selecciona un archivo de imagen (JPG, PNG, WebP)."); return; }
    if (file.size > 2 * 1024 * 1024) { alert("La imagen supera 2MB. Usa una más ligera o pega una URL."); return; }
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => (d ? { ...d, coverImage: String(reader.result) } : d));
    reader.readAsDataURL(file);
  };

  const cancelEdit = () => {
    setEditId(null);
    setDraft(null);
  };

  const saveEdit = () => {
    if (!draft) return;
    const next = products.map((p) =>
      p.id === draft.id
        ? {
            ...p,
            name: draft.name,
            version: draft.version || undefined,
            tagline: draft.tagline,
            cardDescription: draft.cardDescription || undefined,
            longDescription: draft.longDescription || undefined,
            coverImage: draft.coverImage || undefined,
            downloadUrl: draft.downloadUrl || undefined,
            author: draft.author || undefined,
            premium: draft.premium,
            enabled: draft.enabled,
            salesCount: draft.salesCount,
            order: draft.order,
          }
        : p
    );
    setProducts(next);
    saveOverrides(next);
    cancelEdit();
  };

  const toggleEnabled = (id: string) => {
    const next = products.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p));
    setProducts(next);
    saveOverrides(next);
  };

  const resetAll = () => {
    if (!confirm("¿Resetear todos los productos a su valor por defecto?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setProducts([...DEFAULT_PRODUCTS]);
    PRODUCTS.splice(0, PRODUCTS.length, ...DEFAULT_PRODUCTS);
  };

  const filtered = filterCategory === "all"
    ? products
    : products.filter((p) => p.categorySlug === filterCategory);

  return (
    <AdminShell
      title="Productos / Subcategorías"
      description="Edita el catálogo de productos visibles en cada categoría. Cambios persisten en localStorage hasta integrar DB."
      icon={Package}
      iconGradient="from-violet-500 to-fuchsia-600"
      status="live"
      breadcrumb={[{ label: "Productos" }]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => alert("Próximamente: crear producto desde cero")}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
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
            return (
              <option key={c.slug} value={c.slug} className="bg-[#0f1219]">
                {c.title} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {/* Lista de productos */}
      <div className="space-y-3">
        {filtered.map((p) => {
          const category = CATEGORIES.find((c) => c.slug === p.categorySlug);
          const isEditing = editId === p.id;

          return (
            <div
              key={p.id}
              className={`glass-card rounded-2xl border ${isEditing ? "border-violet-500/40 shadow-lg shadow-violet-500/15" : "border-white/10"} overflow-hidden transition-all`}
            >
              {/* Header de la card */}
              <div className="flex items-start gap-4 p-4 sm:p-5 border-b border-white/8">
                {/* Mini cover */}
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
                    <h3 className="text-white font-bold text-base">
                      {p.name}
                      {p.version && <span className={`text-xs font-black ml-1.5 ${p.textAccent}`}>{p.version}</span>}
                    </h3>
                    {p.premium && (
                      <span className="text-[9px] font-black bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full px-1.5 py-0.5">PRO</span>
                    )}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      p.enabled
                        ? "bg-green-500/15 text-green-400 border border-green-500/30"
                        : "bg-white/5 text-white/40 border border-white/10"
                    }`}>
                      {p.enabled ? "VISIBLE" : "OCULTO"}
                    </span>
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
                    <Link
                      href={`/categories/${p.categorySlug}/${p.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      Ver
                    </Link>
                    <button
                      onClick={() => toggleEnabled(p.id)}
                      className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      {p.enabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => startEdit(p)}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow shadow-violet-500/30 transition-all hover:-translate-y-0.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>
                  </div>
                )}
              </div>

              {/* Form de edición inline */}
              {isEditing && draft && (
                <div className="p-4 sm:p-5 space-y-3 bg-white/[0.02]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Nombre del producto">
                      <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="adm-input" />
                    </Field>
                    <Field label="Versión (ej: V1, V2, Beta)">
                      <input value={draft.version} onChange={(e) => setDraft({ ...draft, version: e.target.value })} placeholder="V2" className="adm-input" />
                    </Field>
                    <Field label="Tagline / Subtítulo" full>
                      <input value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} className="adm-input" />
                    </Field>
                    <Field label="Descripción card (1-2 líneas)" full>
                      <textarea
                        rows={2}
                        value={draft.cardDescription}
                        onChange={(e) => setDraft({ ...draft, cardDescription: e.target.value })}
                        className="adm-input resize-none"
                        placeholder="Audio Replace + Clip Cutter + Format Converter..."
                      />
                    </Field>
                    <Field label="🖼️ Imagen del producto (portada)" full>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <label className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer shadow shadow-violet-500/30 hover:-translate-y-0.5 transition-all">
                          <Upload className="w-3.5 h-3.5" /> Subir imagen
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onUploadCover(e.target.files?.[0])}
                          />
                        </label>
                        {draft.coverImage && (
                          <button
                            type="button"
                            onClick={() => setDraft({ ...draft, coverImage: "" })}
                            className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Quitar
                          </button>
                        )}
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
                      <p className="text-white/35 text-[10px] mt-1.5">Si está vacío, se genera un box 3D auto con el gradient del producto. Máx 2MB para subida directa.</p>
                    </Field>
                    <Field label="⬇️ Link de descarga (archivo / instalador)" full>
                      <input
                        value={draft.downloadUrl}
                        onChange={(e) => setDraft({ ...draft, downloadUrl: e.target.value })}
                        placeholder="https://drive.google.com/... o https://tu-cdn.com/yf-auto-clip.zip"
                        className="adm-input font-mono text-[11px]"
                      />
                      <p className="text-white/35 text-[10px] mt-1.5">El comprador recibe este enlace tras pagar. (Como admin lo ves en la landing para verificarlo.)</p>
                    </Field>
                    <Field label="Autor / Brand">
                      <input value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} placeholder="by YANKYFILMS" className="adm-input" />
                    </Field>
                    <Field label="Ventas (social proof)">
                      <input type="number" value={draft.salesCount} onChange={(e) => setDraft({ ...draft, salesCount: +e.target.value })} className="adm-input" />
                    </Field>
                    <Field label="Orden de aparición">
                      <input type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: +e.target.value })} className="adm-input" />
                    </Field>
                    <Field label="Descripción larga" full>
                      <textarea
                        rows={3}
                        value={draft.longDescription}
                        onChange={(e) => setDraft({ ...draft, longDescription: e.target.value })}
                        className="adm-input resize-none"
                      />
                    </Field>
                    <Field label="Opciones" full>
                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer">
                          <input type="checkbox" checked={draft.premium} onChange={(e) => setDraft({ ...draft, premium: e.target.checked })} className="w-3.5 h-3.5 accent-yellow-500" />
                          <span className="text-white text-xs font-semibold flex items-center gap-1"><Crown className="w-3 h-3 text-yellow-400" /> Premium</span>
                        </label>
                        <label className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer">
                          <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} className="w-3.5 h-3.5 accent-green-500" />
                          <span className="text-white text-xs font-semibold flex items-center gap-1"><Eye className="w-3 h-3 text-green-400" /> Visible públicamente</span>
                        </label>
                      </div>
                    </Field>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/8">
                    <button onClick={cancelEdit} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                      <X className="w-3.5 h-3.5" /> Cancelar
                    </button>
                    <button onClick={saveEdit} className="shine-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold px-5 py-2 rounded-lg shadow-lg shadow-violet-500/30 transition-all">
                      <Save className="w-3.5 h-3.5" /> Guardar cambios
                    </button>
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
            <p className="text-white/35 text-xs mt-1">Click &ldquo;Nuevo Producto&rdquo; arriba para crear uno.</p>
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
        :global(.adm-input:focus) {
          border-color: rgba(168, 85, 247, 0.5);
        }
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
