"use client";
import { UserCheck } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="Vendedores"
      description="Sellers, agencias, KYC y verificación de cuentas"
      icon={UserCheck}
      iconGradient="from-yellow-500 to-orange-600"
      status="soon"
      breadcrumb={[{ label: "Vendedores" }]}
    >
      <ComingSoonPanel
        feature="Vendedores"
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