"use client";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-5 py-2.5 text-sm",
        variant === "primary" && "bg-accent text-white hover:bg-accent-hover shadow-glow",
        variant === "secondary" && "bg-surface-overlay text-content-primary hover:bg-surface-hover border border-surface-border",
        variant === "ghost" && "text-content-secondary hover:bg-surface-hover hover:text-content-primary",
        variant === "outline" && "border border-surface-border text-content-secondary hover:bg-surface-hover hover:text-content-primary",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
