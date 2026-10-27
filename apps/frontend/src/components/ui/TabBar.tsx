"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  href: string;
  count?: number;
}

export function TabBar({ tabs }: { tabs: TabItem[] }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-surface-border">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/knowledge"
            ? pathname === "/knowledge"
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              isActive ? "text-accent" : "text-content-secondary hover:text-content-primary"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs text-content-muted">({tab.count})</span>
            )}
            {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
          </Link>
        );
      })}
    </div>
  );
}
