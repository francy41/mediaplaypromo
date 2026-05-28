"use client";
import { Film } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="Media Library"
      description="Imágenes, videos, reels, AI media y CDN"
      icon={Film}
      iconGradient="from-pink-500 to-rose-600"
      status="soon"
      breadcrumb={[{ label: "Media Library" }]}
    >
      <ComingSoonPanel
        feature="Media Library"
        requirements={[
          "Backend dedicado (Node/Edge runtime + DB)",
          "API endpoints CRUD con auth + role guard",
          "Integraciones externas según el módulo",
          "Tests E2E para flujos críticos",
        ]}
      />
    </AdminShell>
  );
}