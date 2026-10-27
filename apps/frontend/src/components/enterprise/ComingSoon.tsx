import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted">
        <Construction className="h-7 w-7 text-accent" />
      </div>
      <h1 className="text-xl font-semibold text-content-primary">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-content-secondary">
        {description || "This module is part of the roadmap and will be available in an upcoming phase."}
      </p>
    </div>
  );
}
