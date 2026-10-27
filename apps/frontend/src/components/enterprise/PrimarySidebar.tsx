"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { primaryNavigation } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function PrimarySidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-surface-border bg-surface-raised">
      <div className="flex-1 overflow-y-auto p-2">
        {primaryNavigation.map((section) => {
          const isOpen = collapsed[section.title] !== false;

          return (
            <div key={section.title} className="mb-1">
              <button
                type="button"
                onClick={() => setCollapsed((s) => ({ ...s, [section.title]: !isOpen }))}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-content-muted hover:text-content-secondary"
              >
                {section.title}
                {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              {isOpen && (
                <ul className="mt-0.5 space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                            active
                              ? "bg-accent-muted text-accent font-medium"
                              : "text-content-secondary hover:bg-surface-hover hover:text-content-primary"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto rounded bg-surface-overlay px-1.5 text-[10px] text-content-muted">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
