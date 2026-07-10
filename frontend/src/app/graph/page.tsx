import { AuthGuard } from "@/components/AuthGuard";
import { GraphContent } from "@/components/GraphContent";

export default function GraphPage() {
  return (
    <AuthGuard>
      <GraphContent />
    </AuthGuard>
  );
}
