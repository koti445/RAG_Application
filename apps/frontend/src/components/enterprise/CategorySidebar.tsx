"use client";

import { Folder, Search } from "lucide-react";
import { useState } from "react";
import { categoryTree } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface CategorySidebarProps {
  title?: string;
}

export function CategorySidebar({ title = "Categories" }: CategorySidebarProps) {
  const [selected, setSelected] = useState("All");
  const [filter, setFilter] = useState("");

  const filtered = categoryTree.filter((c) =>
    c.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-surface-border bg-surface">
      <div className="border-b border-surface-border p-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-content-muted">{title}</h2>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-muted" />
          <input
            type="search"
            placeholder="Filter categories..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded-md border border-surface-border bg-surface-overlay py-1.5 pl-8 pr-2 text-xs text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      <ul className="flex-1 overflow-y-auto p-2">
        {filtered.map((category) => (
          <li key={category}>
            <button
              type="button"
              onClick={() => setSelected(category)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                selected === category
                  ? "bg-accent-muted text-accent"
                  : "text-content-secondary hover:bg-surface-hover hover:text-content-primary"
              )}
            >
              <Folder className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <span className="truncate">{category}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
