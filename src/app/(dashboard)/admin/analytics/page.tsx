"use client";
import { BarChart3 } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="Analytics Global"
      description="Revenue, growth, conversiones y traffic"
      icon={BarChart3}
      iconGradient="from-blue-500 to-indigo-600"
      status="soon"
      breadcrumb={[{ label: "Analytics Global" }]}
    >
      <ComingSoonPanel
        feature="Analytics Global"
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