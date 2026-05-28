"use client";
import { Settings } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="Ajustes Globales"
      description="Branding, SEO, legal, integraciones globales"
      icon={Settings}
      iconGradient="from-slate-500 to-gray-600"
      status="soon"
      breadcrumb={[{ label: "Ajustes Globales" }]}
    >
      <ComingSoonPanel
        feature="Ajustes Globales"
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