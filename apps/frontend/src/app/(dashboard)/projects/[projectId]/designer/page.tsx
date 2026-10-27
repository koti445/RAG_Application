import { RagDesigner } from "@/components/designer/RagDesigner";
import { Button } from "@/components/ui/Button";

export default function DesignerPage() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-content-primary">Pipeline Designer</h1>
        <Button size="sm">Save Graph</Button>
      </div>
      <div className="enterprise-panel overflow-hidden">
        <RagDesigner />
      </div>
    </div>
  );
}
