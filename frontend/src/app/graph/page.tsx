import { AuthGuard } from "@/components/AuthGuard";
import { TrendContent } from "@/components/TrendContent";

export default function GraphPage() {
  return (
    <AuthGuard>
      <TrendContent />
    </AuthGuard>
  );
}
