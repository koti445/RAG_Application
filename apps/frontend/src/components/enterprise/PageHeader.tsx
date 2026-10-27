"use client";

import { Button } from "@/components/ui/Button";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void };
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-content-primary">{title}</h1>
        {description && <p className="mt-1 text-sm text-content-secondary">{description}</p>}
      </div>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
