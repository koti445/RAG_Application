"use client";

import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";

export function ProjectsPageContent() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-content-primary">Projects</h1>
          <p className="mt-1 text-sm text-content-secondary">
            Manage your RAG pipeline projects and workspaces.
          </p>
        </div>
        <Button type="button">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total Projects" value={0} icon={FolderKanban} />
        <MetricCard label="Active Pipelines" value={0} />
        <MetricCard label="Eval Runs" value={0} />
      </div>

      <SearchInput placeholder="Search projects..." className="max-w-md" />

      <DataTable
        columns={[
          { key: "name", header: "Project Name", render: () => <span className="text-content-primary">—</span> },
          { key: "status", header: "Status", render: () => <Badge variant="accent">Draft</Badge> },
          { key: "pipelines", header: "Pipelines" },
          { key: "updated", header: "Last Updated" },
        ]}
        data={[]}
        emptyMessage="No projects yet"
        emptyDescription="Create a project to start designing RAG pipelines with the visual designer."
      />

      <p className="text-xs text-content-muted">
        Open the{" "}
        <Link href="/knowledge" className="text-accent hover:underline">Knowledge</Link>
        {" "}module or use the sidebar to navigate between catalog items.
      </p>
    </div>
  );
}
