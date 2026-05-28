"use client";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-cyan-500 hover:bg-cyan-400 text-black": variant === "default",
            "border border-white/20 hover:border-white/40 text-white bg-white/5 hover:bg-white/10": variant === "outline",
            "hover:bg-white/10 text-white": variant === "ghost",
            "bg-red-500 hover:bg-red-400 text-white": variant === "danger",
            "bg-green-500 hover:bg-green-400 text-white": variant === "success",
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
