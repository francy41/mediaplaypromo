import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export function Card({ children, className, hover, gradient }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-[#0f1117]",
        hover && "hover:border-white/20 transition-all duration-200 cursor-pointer",
        gradient && "bg-gradient-to-br",
        className
      )}
    >
      {children}
    </div>
  );
}
