"use client";
import { Bell } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="Notificaciones"
      description="Broadcast push, email campaigns y in-app notifications"
      icon={Bell}
      iconGradient="from-red-500 to-rose-600"
      status="soon"
      breadcrumb={[{ label: "Notificaciones" }]}
    >
      <ComingSoonPanel
        feature="Notificaciones"
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