import { ThemeToggle } from "@/components/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="always-dark min-h-screen bg-[#070809] flex items-center justify-center p-4 relative" style={{ colorScheme: "dark" }}>
      {/* Floating theme toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle compact />
      </div>
      {children}
    </div>
  );
}
