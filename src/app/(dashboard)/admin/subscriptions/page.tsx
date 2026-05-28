"use client";
import { Activity } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="Suscripciones"
      description="Planes, precios, billing recurrente y dunning"
      icon={Activity}
      iconGradient="from-blue-500 to-cyan-600"
      status="soon"
      breadcrumb={[{ label: "Suscripciones" }]}
    >
      <ComingSoonPanel
        feature="Suscripciones"
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