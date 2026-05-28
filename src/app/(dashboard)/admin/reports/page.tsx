"use client";
import { FileText } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="Reportes"
      description="Exportaciones CSV/PDF, reportes financieros y de uso"
      icon={FileText}
      iconGradient="from-emerald-500 to-green-600"
      status="soon"
      breadcrumb={[{ label: "Reportes" }]}
    >
      <ComingSoonPanel
        feature="Reportes"
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