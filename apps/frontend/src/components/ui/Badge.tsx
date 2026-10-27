import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "accent";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variant === "default" && "bg-surface-overlay text-content-secondary",
        variant === "success" && "bg-emerald-500/15 text-emerald-400",
        variant === "warning" && "bg-amber-500/15 text-amber-400",
        variant === "accent" && "bg-accent-muted text-accent",
        className
      )}
    >
      {children}
    </span>
  );
}
