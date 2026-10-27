"use client";

import { BookOpen, Database, FileText, Layers, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { SearchInput } from "@/components/ui/SearchInput";
import { TabBar } from "@/components/ui/TabBar";
import { knowledgeTabs } from "@/config/navigation";

const columns = [
  { key: "name", header: "KB Name" },
  { key: "type", header: "Type" },
  { key: "store", header: "Vector Store" },
  { key: "scope", header: "Scope" },
  { key: "docs", header: "Docs" },
  { key: "status", header: "Status" },
  { key: "indexed", header: "Last Indexed" },
];

export function KnowledgePageContent() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-surface-border px-6 pt-4">
        <TabBar tabs={knowledgeTabs} />
      </div>

      <div className="flex-1 space-y-4 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput placeholder="Search knowledge bases..." className="max-w-md" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" type="button">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            <Button size="sm" type="button">
              <Plus className="h-4 w-4" />
              Create Knowledge Base
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total KBs" value={0} icon={BookOpen} />
          <MetricCard label="Active" value={0} icon={Database} />
          <MetricCard label="Documents" value={0} icon={FileText} />
          <MetricCard label="Chunks" value={0} icon={Layers} />
        </div>

        <DataTable
          columns={columns}
          data={[]}
          emptyMessage="No knowledge bases found"
          emptyDescription="Create a knowledge base to upload documents and build your RAG index."
        />

        <div className="flex items-center justify-between text-xs text-content-muted">
          <span>0 items</span>
          <div className="flex items-center gap-2">
            <span>Items per page</span>
            <select className="rounded border border-surface-border bg-surface-overlay px-2 py-1 text-content-secondary">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
