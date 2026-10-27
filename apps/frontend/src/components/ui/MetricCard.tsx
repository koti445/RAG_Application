import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  className?: string;
}

export function MetricCard({ label, value, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <div className={cn("enterprise-panel p-4", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-content-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-content-primary">{value}</p>
          {trend && <p className="mt-1 text-xs text-content-secondary">{trend}</p>}
        </div>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-muted">
            <Icon className="h-4 w-4 text-accent" />
          </div>
        )}
      </div>
    </div>
  );
}
