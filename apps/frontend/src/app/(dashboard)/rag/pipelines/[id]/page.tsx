import { Suspense } from "react";
import { RagWorkspaceContent } from "@/components/rag/RagWorkspaceContent";

export default function RagPipelineWorkspacePage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-content-muted">Loading...</div>}>
      <RagWorkspaceContent pipelineId={params.id} />
    </Suspense>
  );
}
