"use client";
import { useState } from "react";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Copy, GripVertical,
  ToggleLeft, ToggleRight, Settings, Image as ImageIcon,
  Search, Check, X, ChevronUp, ChevronDown, Star,
  Layout, Monitor, Smartphone, Save
} from "lucide-react";
import { CATEGORIES, type Category } from "@/lib/categories";
import Link from "next/link";

type EditState = {
  title: string;
  subtitle: string;
  enabled: boolean;
  showSidebar: boolean;
  showHomepage: boolean;
  premium: boolean;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories]   = useState([...CATEGORIES].sort((a, b) => a.order - b.order));
  const [search, setSearch]           = useState("");
  const [editId, setEditId]           = useState<string | null>(null);
  const [editState, setEditState]     = useState<EditState | null>(null);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [saved, setSaved]             = useState<string | null>(null);

  const filtered = categories.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditState({
      title:       cat.title,
      subtitle:    cat.subtitle,
      enabled:     cat.enabled,
      showSidebar: cat.showSidebar,
      showHomepage:cat.showHomepage,
      premium:     cat.premium,
    });
  };

  const saveEdit = (id: string) => {
    if (!editState) return;
    setCategories(cats => cats.map(c => c.id === id ? { ...c, ...editState } : c));
    setEditId(null);
    setSaved(id);
    setTimeout(() => setSaved(null), 2000);
  };

  const cancelEdit = () => { setEditId(null); setEditState(null); };

  const toggleEnabled = (id: string) => {
    setCategories(cats => cats.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  const toggleHomepage = (id: string) => {
    setCategories(cats => cats.map(c => c.id === id ? { ...c, showHomepage: !c.showHomepage } : c));
  };

  const toggleSidebar = (id: string) => {
    setCategories(cats => cats.map(c => c.id === id ? { ...c, showSidebar: !c.showSidebar } : c));
  };

  const cloneCategory = (cat: Category) => {
    const clone: Category = {
      ...cat,
      id: `cat_clone_${Date.now()}`,
      slug: cat.slug + "-copia",
      title: cat.title + " (Copia)",
      order: categories.length + 1,
    };
    setCategories(cats => [...cats, clone]);
  };

  const deleteCategory = (id: string) => {
    setCategories(cats => cats.filter(c => c.id !== id));
    setDeleteId(null);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const newCats = [...filtered];
    [newCats[idx - 1], newCats[idx]] = [newCats[idx], newCats[idx - 1]];
    setCategories(newCats);
  };

  const moveDown = (idx: number) => {
    if (idx === filtered.length - 1) return;
    const newCats = [...filtered];
    [newCats[idx], newCats[idx + 1]] = [newCats[idx + 1], newCats[idx]];
    setCategories(newCats);
  };

  const enabledCount  = categories.filter(c => c.enabled).length;
  const homepageCount = categories.filter(c => c.showHomepage).length;
  const premiumCount  = categories.filter(c => c.premium).length;

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header stats ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Categorías",   value: categories.length, icon: Layout,    color: "text-orange-400", bg: "bg-orange-500/15" },
          { label: "Habilitadas",        value: enabledCount,      icon: ToggleRight,color: "text-green-400",  bg: "bg-green-500/15" },
          { label: "Visibles Homepage",  value: homepageCount,     icon: Monitor,   color: "text-blue-400",   bg: "bg-blue-500/15" },
          { label: "Módulos Pro",        value: premiumCount,      icon: Star,      color: "text-yellow-400", bg: "bg-yellow-500/15" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[#0f1219] border border-white/8 rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-white font-bold text-2xl">{s.value}</p>
              <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar categoría..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500/40 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-orange-500/20">
          <Plus className="w-4 h-4" /> Nueva Categoría
        </button>
      </div>

      {/* ── Categories Table ── */}
      <div className="bg-[#0f1219] border border-white/8 rounded-2xl overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[2rem_2.5fr_1fr_7rem_7rem_7rem_6rem_6rem] gap-3 px-5 py-3 border-b border-white/8 bg-white/2">
          <span />
          <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider">Categoría</span>
          <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider">Herramientas</span>
          <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider text-center">Estado</span>
          <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider text-center">Sidebar</span>
          <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider text-center">Homepage</span>
          <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider text-center">Plan</span>
          <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider text-center">Acciones</span>
        </div>

        <div className="divide-y divide-white/5">
          {filtered.map((cat, idx) => {
            const Icon      = cat.icon;
            const isEditing = editId === cat.id;
            const wasSaved  = saved === cat.id;

            return (
              <div key={cat.id} className={`grid grid-cols-[2rem_2.5fr_1fr_7rem_7rem_7rem_6rem_6rem] gap-3 px-5 py-4 items-center transition-colors ${isEditing ? "bg-orange-500/5 border-l-2 border-orange-500" : "hover:bg-white/2"}`}>

                {/* Drag handle + reorder */}
                <div className="flex flex-col items-center gap-0.5">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-white/20 hover:text-white/60 disabled:opacity-20 transition-colors">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => moveDown(idx)} disabled={idx === filtered.length - 1} className="text-white/20 hover:text-white/60 disabled:opacity-20 transition-colors">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Name + icon */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    {isEditing ? (
                      <input
                        value={editState?.title ?? ""}
                        onChange={e => setEditState(s => s ? { ...s, title: e.target.value } : s)}
                        className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white w-full focus:outline-none focus:border-orange-500/50"
                      />
                    ) : (
                      <p className="text-white font-semibold text-sm truncate">{cat.title}</p>
                    )}
                    <p className="text-white/30 text-[10px] truncate">/categories/{cat.slug}</p>
                  </div>
                </div>

                {/* Tool count */}
                <div>
                  <span className="bg-white/8 text-white/50 text-xs px-2 py-0.5 rounded-full">{cat.tools.length} módulos</span>
                </div>

                {/* Estado toggle */}
                <div className="flex justify-center">
                  <button
                    onClick={() => isEditing ? setEditState(s => s ? { ...s, enabled: !s.enabled } : s) : toggleEnabled(cat.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                      (isEditing ? editState?.enabled : cat.enabled)
                        ? "bg-green-500/15 text-green-400 border-green-500/20"
                        : "bg-white/5 text-white/30 border-white/10"
                    }`}
                  >
                    {(isEditing ? editState?.enabled : cat.enabled) ? "Activo" : "Oculto"}
                  </button>
                </div>

                {/* Sidebar toggle */}
                <div className="flex justify-center">
                  <button
                    onClick={() => isEditing ? setEditState(s => s ? { ...s, showSidebar: !s.showSidebar } : s) : toggleSidebar(cat.id)}
                    className={(isEditing ? editState?.showSidebar : cat.showSidebar) ? "text-blue-400" : "text-white/20"}
                  >
                    {(isEditing ? editState?.showSidebar : cat.showSidebar)
                      ? <ToggleRight className="w-5 h-5" />
                      : <ToggleLeft  className="w-5 h-5" />
                    }
                  </button>
                </div>

                {/* Homepage toggle */}
                <div className="flex justify-center">
                  <button
                    onClick={() => isEditing ? setEditState(s => s ? { ...s, showHomepage: !s.showHomepage } : s) : toggleHomepage(cat.id)}
                    className={(isEditing ? editState?.showHomepage : cat.showHomepage) ? "text-purple-400" : "text-white/20"}
                  >
                    {(isEditing ? editState?.showHomepage : cat.showHomepage)
                      ? <ToggleRight className="w-5 h-5" />
                      : <ToggleLeft  className="w-5 h-5" />
                    }
                  </button>
                </div>

                {/* Premium badge */}
                <div className="flex justify-center">
                  {cat.premium ? (
                    <span className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 text-yellow-400 border border-yellow-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full">
                      PRO
                    </span>
                  ) : (
                    <span className="text-white/20 text-[10px]">Free</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-1.5">
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEdit(cat.id)} className="w-7 h-7 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 flex items-center justify-center transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={cancelEdit} className="w-7 h-7 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 flex items-center justify-center transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      {wasSaved && (
                        <span className="text-green-400 text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3" /> Guardado
                        </span>
                      )}
                      <Link href={`/categories/${cat.slug}`} className="w-7 h-7 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all" title="Ver">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => startEdit(cat)} className="w-7 h-7 rounded-lg bg-white/5 text-white/40 hover:bg-blue-500/20 hover:text-blue-400 flex items-center justify-center transition-all" title="Editar">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => cloneCategory(cat)} className="w-7 h-7 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all" title="Clonar">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(cat.id)} className="w-7 h-7 rounded-lg bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all" title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Delete confirmation modal ── */}
      {deleteId && (() => {
        const cat = categories.find(c => c.id === deleteId);
        if (!cat) return null;
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#0f1219] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-4 mx-auto">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-white font-bold text-center mb-2">Eliminar categoría</h3>
              <p className="text-white/50 text-sm text-center mb-5">
                ¿Seguro que quieres eliminar <strong className="text-white">"{cat.title}"</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 py-2.5 rounded-xl text-sm transition-all">
                  Cancelar
                </button>
                <button onClick={() => deleteCategory(deleteId)} className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-2.5 rounded-xl text-sm transition-all">
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Legend ── */}
      <div className="flex items-center gap-6 text-xs text-white/25 flex-wrap">
        <div className="flex items-center gap-1.5"><ToggleRight className="w-4 h-4 text-blue-400" /> Visible en Sidebar</div>
        <div className="flex items-center gap-1.5"><ToggleRight className="w-4 h-4 text-purple-400" /> Visible en Homepage</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500/50" /> Activo</div>
        <div className="flex items-center gap-1.5"><ChevronUp className="w-3.5 h-3.5" /><ChevronDown className="w-3.5 h-3.5" /> Reordenar</div>
        <div className="flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" /> Clonar categoría</div>
      </div>
    </div>
  );
}
