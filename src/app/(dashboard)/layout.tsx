import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#080a0f] flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 pb-20 lg:pb-0">
            <div className="p-3 sm:p-4 lg:p-6">{children}</div>
          </main>
        </div>
        <MobileBottomNav variant="dashboard" />
      </div>
    </AuthGuard>
  );
}
