"use client";
import { Mail } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="SMTP and Email"
      description="Servidor SMTP, dominios verificados y deliverability"
      icon={Mail}
      iconGradient="from-orange-500 to-red-600"
      status="soon"
      breadcrumb={[{ label: "SMTP and Email" }]}
    >
      <ComingSoonPanel
        feature="SMTP and Email"
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