"use client";
import { useState } from "react";
import { Layers, Video as VideoIcon, Image as ImageIcon } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { BatchGenerator } from "@/components/ai/BatchGenerator";

export default function BatchAdminPage() {
  const [kind, setKind] = useState<"video" | "image">("video");

  return (
    <AdminShell
      title="Batch AI Generator"
      description="Genera videos o imágenes en masa. Margen real 50% sobre coste Muapi."
      icon={Layers}
      iconGradient="from-fuchsia-500 to-purple-600"
      status="live"
      breadcrumb={[{ label: "Batch Generator" }]}
      actions={
        <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => setKind("video")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              kind === "video" ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow" : "text-white/55 hover:text-white"
            }`}
          >
            <VideoIcon className="w-3.5 h-3.5" /> Videos
          </button>
          <button
            onClick={() => setKind("image")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              kind === "image" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow" : "text-white/55 hover:text-white"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Imágenes
          </button>
        </div>
      }
    >
      <BatchGenerator kind={kind} />
    </AdminShell>
  );
}
