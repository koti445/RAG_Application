"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Code2, FileText, Network, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RAG_PIPELINE_TEMPLATES } from "@/config/rag-pipeline-create";
import { cn } from "@/lib/utils";

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  quick_service: Bot,
  technical_docs: FileText,
  code_search: Code2,
};

export function RagPipelineTemplatePicker() {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-accent" />
          <h1 className="text-lg font-semibold text-content-primary">Create RAG Pipeline</h1>
        </div>
        <button
          type="button"
          onClick={() => router.push("/rag/pipelines")}
          className="text-content-muted hover:text-content-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <button
          type="button"
          onClick={() => router.push("/rag/pipelines")}
          className="mb-6 flex items-center gap-1 text-sm text-content-secondary hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pipelines
        </button>

        <section className="rag-create-section">
          <h3 className="rag-create-section-title">Choose a Template</h3>
          <p className="mb-4 text-xs text-content-secondary">
            Start from a pre-configured pipeline template. You can customize all settings after selecting.
          </p>
          <div className="rag-card-grid lg:grid-cols-3">
            {RAG_PIPELINE_TEMPLATES.map((template) => {
              const Icon = TEMPLATE_ICONS[template.id] ?? Network;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => router.push(`/rag/pipelines/new/configure?template=${template.id}`)}
                  className={cn("rag-select-card text-left")}
                >
                  <Icon className="mb-2 h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-content-primary">{template.name}</span>
                  <span className="mt-1 text-xs text-content-muted">{template.description}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => router.push("/rag/pipelines/new/configure")}>
            Start from scratch
          </Button>
        </div>
      </div>
    </div>
  );
}
