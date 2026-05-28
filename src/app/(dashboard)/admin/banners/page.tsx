"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Plus, Trash2, Save, Eye, EyeOff, ArrowUp, ArrowDown,
  RotateCcw, Edit3, Check, X, ExternalLink, Image as ImageIcon
} from "lucide-react";
import {
  useBanners, resetBanners, GRADIENT_OPTIONS, gradientFor,
  type Banner,
} from "@/lib/banners";
import { useAuth } from "@/lib/auth-context";

function emptyBanner(order: number): Banner {
  return {
    id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    enabled: true,
    order,
    badge: "NUEVO BANNER",
    title: "Título principal",
    accent: "destacado.",
    subtitle: "Descripción del banner aquí. Edita este texto a tu medida.",
    ctaLabel: "ACCIÓN",
    ctaHref: "/register",
    secondaryLabel: "",
    secondaryHref: "",
    gradientFrom: "cyan-400",
    gradientTo: "blue-500",
  };
}

export default function BannersAdminPage() {
  const { user } = useAuth();
  const [banners, setBanners] = useBanners();
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Banner | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Lock to SuperAdmin
  if (user && user.role !== "superadmin") {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
        <p className="text-red-400 font-bold">Acceso restringido a SuperAdmin.</p>
      </div>
    );
  }

  const sorted = [...banners].sort((a, b) => a.order - b.order);

  const startEdit = (b: Banner) => {
    setEditId(b.id);
    setDraft({ ...b });
  };
  const cancelEdit = () => {
    setEditId(null);
    setDraft(null);
  };
  const saveEdit = () => {
    if (!draft) return;
    setBanners(banners.map((b) => (b.id === draft.id ? draft : b)));
    cancelEdit();
  };
  const toggleEnabled = (id: string) => {
    setBanners(banners.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  };
  const move = (id: string, dir: -1 | 1) => {
    const idx = sorted.findIndex((b) => b.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const c = sorted[swapIdx];
    setBanners(
      banners.map((b) => {
        if (b.id === a.id) return { ...b, order: c.order };
        if (b.id === c.id) return { ...b, order: a.order };
        return b;
      })
    );
  };
  const remove = (id: string) => {
    setBanners(banners.filter((b) => b.id !== id));
    setConfirmDelete(null);
  };
  const add = () => {
    const maxOrder = banners.reduce((m, b) => Math.max(m, b.order), 0);
    const nb = emptyBanner(maxOrder + 1);
    setBanners([...banners, nb]);
    startEdit(nb);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-500/20 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 text-[11px] font-bold uppercase tracking-[0.18em]">SuperAdmin</span>
          </div>
          <h1 className="text-white text-2xl font-black">Banners del Homepage</h1>
          <p className="text-white/50 text-sm mt-1">
            Gestiona el slider del hero. Cambios visibles inmediatamente en la página pública.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/75 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Ver homepage
          </Link>
          <button
            onClick={() => {
              if (confirm("¿Restaurar banners por defecto? Se perderán tus cambios.")) {
                resetBanners();
                setBanners([]);
                setTimeout(() => location.reload(), 100);
              }
            }}
            className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/75 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar
          </button>
          <button
            onClick={add}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-cyan-500/30"
          >
            <Plus className="w-4 h-4" /> Nuevo banner
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", val: banners.length, color: "text-white" },
          { label: "Activos", val: banners.filter((b) => b.enabled).length, color: "text-green-400" },
          { label: "Ocultos", val: banners.filter((b) => !b.enabled).length, color: "text-orange-400" },
          { label: "Estado", val: "Live", color: "text-cyan-400" },
        ].map((k) => (
          <div key={k.label} className="bg-[#0f1219] border border-white/8 rounded-xl p-4">
            <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">{k.label}</p>
            <p className={`text-2xl font-black mt-1 ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Banners list */}
      <div className="space-y-4">
        {sorted.length === 0 && (
          <div className="bg-[#0f1219] border border-dashed border-white/15 rounded-2xl p-10 text-center">
            <p className="text-white/50 text-sm">No hay banners. Crea uno nuevo para empezar.</p>
          </div>
        )}

        {sorted.map((b, i) => {
          const g = gradientFor(b);
          const isEditing = editId === b.id;
          const d = isEditing && draft ? draft : b;

          return (
            <div
              key={b.id}
              className={`bg-[#0f1219] border ${
                isEditing ? "border-cyan-500/40 shadow-lg shadow-cyan-500/10" : "border-white/8"
              } rounded-2xl overflow-hidden transition-all`}
            >
              {/* Preview strip */}
              <div className={`relative h-24 bg-gradient-to-br ${g.bg} bg-[#0a0c10] flex items-center px-5 border-b border-white/8`}>
                <div className={`absolute -top-10 -right-10 w-40 h-40 ${g.orb} rounded-full blur-3xl pointer-events-none`} />
                <div className="relative z-10 flex-1">
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">{d.badge}</p>
                  <h3 className="text-white font-black text-lg mt-1 truncate">
                    {d.title}{" "}
                    <span className={`text-transparent bg-clip-text bg-gradient-to-r ${g.text}`}>{d.accent}</span>
                  </h3>
                </div>
                <div className="relative z-10 flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      b.enabled ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/5 text-white/40 border border-white/10"
                    }`}
                  >
                    {b.enabled ? "ACTIVO" : "OCULTO"}
                  </span>
                  <span className="text-white/30 text-[10px] font-mono">#{b.order}</span>
                </div>
              </div>

              {/* Actions row */}
              {!isEditing && (
                <div className="flex flex-wrap items-center gap-2 p-4">
                  <button
                    onClick={() => startEdit(b)}
                    className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => toggleEnabled(b.id)}
                    className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {b.enabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {b.enabled ? "Ocultar" : "Mostrar"}
                  </button>
                  <button
                    onClick={() => move(b.id, -1)}
                    disabled={i === 0}
                    className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => move(b.id, 1)}
                    disabled={i === sorted.length - 1}
                    className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(b.id)}
                    className="ml-auto inline-flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
              )}

              {/* Edit form */}
              {isEditing && draft && (
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Badge / Etiqueta superior">
                      <input
                        value={draft.badge}
                        onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
                        className="input"
                      />
                    </Field>
                    <Field label="Orden">
                      <input
                        type="number"
                        value={draft.order}
                        onChange={(e) => setDraft({ ...draft, order: parseInt(e.target.value) || 0 })}
                        className="input"
                      />
                    </Field>
                    <Field label="Título principal">
                      <input
                        value={draft.title}
                        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                        className="input"
                      />
                    </Field>
                    <Field label="Texto destacado (con gradient)">
                      <input
                        value={draft.accent}
                        onChange={(e) => setDraft({ ...draft, accent: e.target.value })}
                        className="input"
                      />
                    </Field>
                    <Field label="Subtítulo / Descripción" full>
                      <textarea
                        rows={2}
                        value={draft.subtitle}
                        onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                        className="input resize-none"
                      />
                    </Field>
                    <Field label="CTA principal — Texto">
                      <input
                        value={draft.ctaLabel}
                        onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })}
                        className="input"
                      />
                    </Field>
                    <Field label="CTA principal — Link">
                      <input
                        value={draft.ctaHref}
                        onChange={(e) => setDraft({ ...draft, ctaHref: e.target.value })}
                        className="input"
                        placeholder="/register"
                      />
                    </Field>
                    <Field label="CTA secundario — Texto (opcional)">
                      <input
                        value={draft.secondaryLabel ?? ""}
                        onChange={(e) => setDraft({ ...draft, secondaryLabel: e.target.value })}
                        className="input"
                      />
                    </Field>
                    <Field label="CTA secundario — Link (opcional)">
                      <input
                        value={draft.secondaryHref ?? ""}
                        onChange={(e) => setDraft({ ...draft, secondaryHref: e.target.value })}
                        className="input"
                      />
                    </Field>
                    <Field label="Gradient (color del slide)" full>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {GRADIENT_OPTIONS.map((g) => {
                          const sel = draft.gradientFrom === g.from && draft.gradientTo === g.to;
                          const swatchG = gradientFor({ ...draft, gradientFrom: g.from, gradientTo: g.to });
                          return (
                            <button
                              key={`${g.from}|${g.to}`}
                              onClick={() => setDraft({ ...draft, gradientFrom: g.from, gradientTo: g.to })}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                                sel
                                  ? "border-white/40 bg-white/10 text-white"
                                  : "border-white/10 bg-white/3 text-white/60 hover:bg-white/5"
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full bg-gradient-to-br ${swatchG.btn}`} />
                              {g.label}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/8">
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Cancelar
                    </button>
                    <button
                      onClick={saveEdit}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white text-xs font-bold px-5 py-2 rounded-lg transition-all shadow-lg shadow-cyan-500/30"
                    >
                      <Save className="w-3.5 h-3.5" /> Guardar cambios
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1219] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-bold text-lg mb-2">¿Eliminar este banner?</h3>
            <p className="text-white/50 text-sm mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => remove(confirmDelete)}
                className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold px-4 py-2 rounded-lg inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        :global(.input) {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 0.625rem;
          padding: 0.55rem 0.75rem;
          color: white;
          font-size: 0.8rem;
          outline: none;
          transition: border-color 0.15s;
        }
        :global(.input:focus) {
          border-color: rgba(34, 211, 238, 0.5);
        }
      `}</style>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}
