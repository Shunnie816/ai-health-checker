import { AuthGuard } from "@/components/AuthGuard";
import { ReportsContent } from "@/components/ReportsContent";

export default function ReportsPage() {
  return (
    <AuthGuard>
      <ReportsContent />
    </AuthGuard>
  );
}
