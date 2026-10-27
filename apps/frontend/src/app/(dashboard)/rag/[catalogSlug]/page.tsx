import { notFound } from "next/navigation";
import { RagCatalogPageContent } from "@/components/rag/RagCatalogPageContent";
import { getCatalogTab, slugToStepType } from "@/config/rag-catalog";

export default function RagCatalogPage({ params }: { params: { catalogSlug: string } }) {
  const stepType = slugToStepType(params.catalogSlug);
  const tab = getCatalogTab(params.catalogSlug);

  if (!stepType || !tab || params.catalogSlug === "pipelines") {
    notFound();
  }

  return (
    <RagCatalogPageContent
      stepType={stepType}
      title={tab.label}
      createLabel={`Create ${tab.label}`}
    />
  );
}
