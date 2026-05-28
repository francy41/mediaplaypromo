"use client";
import { Lock } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="Audit Log"
      description="Registro inmutable de acciones de admin y eventos críticos"
      icon={Lock}
      iconGradient="from-zinc-500 to-slate-600"
      status="soon"
      breadcrumb={[{ label: "Audit Log" }]}
    >
      <ComingSoonPanel
        feature="Audit Log"
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