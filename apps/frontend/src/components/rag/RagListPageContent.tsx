"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Network, Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { SearchInput } from "@/components/ui/SearchInput";
import type { RagPipeline } from "@/lib/api/rag";
import { ragApi } from "@/lib/api/rag";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "accent"> = {
  draft: "default",
  designed: "warning",
  configured: "warning",
  validated: "accent",
  active: "success",
  archived: "default",
};

export function RagListPageContent() {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<RagPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await ragApi.list();
      setPipelines(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load RAG pipelines");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = pipelines.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = pipelines.filter((p) => p.status === "active").length;
  const validatedCount = pipelines.filter((p) =>
    ["validated", "active"].includes(p.status)
  ).length;

  const columns = [
    {
      key: "name",
      header: "RAG Name",
      render: (row: RagPipeline) => (
        <Link href={`/rag/pipelines/${row.id}`} className="font-medium text-content-primary hover:text-accent">
          {row.name}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: RagPipeline) => (
        <Badge variant={STATUS_VARIANT[row.status] || "default"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "steps",
      header: "Steps Configured",
      render: (row: RagPipeline) => {
        const count = Object.keys(row.step_configs || {}).length;
        return <span className="text-content-secondary">{count} / 9</span>;
      },
    },
    {
      key: "design",
      header: "Design",
      render: (row: RagPipeline) => {
        const nodes = row.graph_definition?.nodes?.length ?? 0;
        return nodes > 0 ? (
          <span className="text-emerald-400">{nodes} nodes</span>
        ) : (
          <span className="text-content-muted">Not saved</span>
        );
      },
    },
    {
      key: "updated_at",
      header: "Last Updated",
      render: (row: RagPipeline) => (
        <span className="text-content-muted">
          {new Date(row.updated_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row: RagPipeline) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/rag/pipelines/${row.id}`)}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-end">
        <Button onClick={() => router.push("/rag/pipelines/new")}>
          <Plus className="h-4 w-4" />
          Create RAG Pipeline
        </Button>
      </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            placeholder="Search RAG pipelines..."
            className="max-w-md"
            value={search}
            onChange={setSearch}
          />
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total RAGs" value={pipelines.length} icon={Network} />
          <MetricCard label="Active" value={activeCount} icon={Network} />
          <MetricCard label="Validated" value={validatedCount} icon={Network} />
          <MetricCard label="Draft" value={pipelines.filter((p) => p.status === "draft").length} icon={Network} />
        </div>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="enterprise-panel flex items-center justify-center py-16 text-sm text-content-muted">
            Loading RAG pipelines...
          </div>
        ) : (
          <DataTable<RagPipeline>
            columns={columns}
            data={filtered}
            emptyMessage="No RAG pipelines yet"
            emptyDescription="Create your first RAG to design architecture, configure each step, and run queries with live execution tracing."
          />
        )}
    </div>
  );
}
