"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RAG_CATALOG_TABS } from "@/config/rag-catalog";
import { cn } from "@/lib/utils";

export default function RagLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isTabActive(href: string) {
    if (href === "/rag/pipelines") {
      return pathname === href || pathname.startsWith("/rag/pipelines/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-surface-border px-6 pt-4">
        <div className="mb-1">
          <h1 className="text-lg font-semibold text-content-primary">RAG Catalog</h1>
          <p className="text-sm text-content-secondary">
            Create and validate each RAG step independently, then bind them in a pipeline
          </p>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-surface-border">
          {RAG_CATALOG_TABS.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "relative shrink-0 px-3 py-2.5 text-sm font-medium transition-colors",
                isTabActive(tab.href) ? "text-accent" : "text-content-secondary hover:text-content-primary"
              )}
            >
              {tab.label}
              {isTabActive(tab.href) && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
