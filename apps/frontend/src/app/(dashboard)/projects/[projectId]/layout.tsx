import Link from "next/link";
import { TabBar } from "@/components/ui/TabBar";

const projectTabs = (projectId: string) => [
  { id: "designer", label: "Designer", href: `/projects/${projectId}/designer` },
  { id: "knowledge", label: "Knowledge Base", href: `/projects/${projectId}/knowledge` },
  { id: "retrieval", label: "Retrieval", href: `/projects/${projectId}/retrieval` },
  { id: "memory", label: "Memory", href: `/projects/${projectId}/memory` },
  { id: "generation", label: "Generation", href: `/projects/${projectId}/generation` },
  { id: "playground", label: "Playground", href: `/projects/${projectId}/playground` },
  { id: "evaluation", label: "Evaluation", href: `/projects/${projectId}/evaluation` },
];

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const base = `/projects/${params.projectId}`;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-surface-border bg-surface-raised px-6 py-3">
        <Link href="/projects" className="text-xs text-content-muted hover:text-accent">
          ← Back to Projects
        </Link>
        <h2 className="mt-1 text-lg font-semibold text-content-primary">Project Workspace</h2>
      </div>
      <div className="border-b border-surface-border px-6">
        <TabBar tabs={projectTabs(params.projectId)} />
      </div>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
