"use client";
import { Palette } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="Plantillas Premium"
      description="Templates de Canva, ads, social y branding kits"
      icon={Palette}
      iconGradient="from-fuchsia-500 to-purple-600"
      status="soon"
      breadcrumb={[{ label: "Plantillas Premium" }]}
    >
      <ComingSoonPanel
        feature="Plantillas Premium"
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