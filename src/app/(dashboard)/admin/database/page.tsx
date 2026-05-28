"use client";
import { Database } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="Base de Datos"
      description="Backups, migraciones, integridad y queries"
      icon={Database}
      iconGradient="from-indigo-500 to-purple-600"
      status="soon"
      breadcrumb={[{ label: "Base de Datos" }]}
    >
      <ComingSoonPanel
        feature="Base de Datos"
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