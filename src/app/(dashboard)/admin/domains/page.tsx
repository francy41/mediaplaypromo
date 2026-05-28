"use client";
import { Server } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="Dominios y DNS"
      description="Verificación DNS, SSL automático y multi-tenant routing"
      icon={Server}
      iconGradient="from-teal-500 to-cyan-600"
      status="soon"
      breadcrumb={[{ label: "Dominios y DNS" }]}
    >
      <ComingSoonPanel
        feature="Dominios y DNS"
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