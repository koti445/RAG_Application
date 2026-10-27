import { Suspense } from "react";
import { RagPipelineCreateForm } from "@/components/rag/create/RagPipelineCreateForm";

export default function ConfigureRagPipelinePage() {
  return (
    <Suspense fallback={<div className="p-6 text-content-muted">Loading pipeline configuration...</div>}>
      <RagPipelineCreateForm />
    </Suspense>
  );
}
