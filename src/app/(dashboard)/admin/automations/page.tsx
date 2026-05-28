"use client";
import { Bot } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="Automatizaciones"
      description="Workflows, webhooks y triggers globales"
      icon={Bot}
      iconGradient="from-amber-500 to-orange-600"
      status="soon"
      breadcrumb={[{ label: "Automatizaciones" }]}
    >
      <ComingSoonPanel
        feature="Automatizaciones"
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