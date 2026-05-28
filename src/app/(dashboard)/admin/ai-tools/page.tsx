"use client";
import { Sparkles } from "lucide-react";
import { AdminShell, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function Page() {
  return (
    <AdminShell
      title="AI Tools and APIs"
      description="Claves OpenAI, ElevenLabs, Replicate, créditos y límites"
      icon={Sparkles}
      iconGradient="from-violet-500 to-purple-600"
      status="soon"
      breadcrumb={[{ label: "AI Tools and APIs" }]}
    >
      <ComingSoonPanel
        feature="AI Tools and APIs"
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