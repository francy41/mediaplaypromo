"use client";
import { ShoppingBag } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="Marketplace"
      description="Productos, servicios, aprobaciones y fees del marketplace"
      icon={ShoppingBag}
      iconGradient="from-rose-500 to-pink-600"
      status="soon"
      breadcrumb={[{ label: "Marketplace" }]}
    >
      <ComingSoonPanel
        feature="Marketplace"
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