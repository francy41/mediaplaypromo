"use client";
import { LayoutGrid } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="Homepage Builder"
      description="Edita secciones, layouts y CTAs del homepage"
      icon={LayoutGrid}
      iconGradient="from-cyan-500 to-blue-600"
      status="soon"
      breadcrumb={[{ label: "Homepage Builder" }]}
    >
      <ComingSoonPanel
        feature="Homepage Builder"
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