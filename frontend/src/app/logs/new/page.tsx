import { AuthGuard } from "@/components/AuthGuard";
import { LogForm } from "@/components/LogForm";

export default function NewLogPage() {
  return (
    <AuthGuard>
      <LogForm />
    </AuthGuard>
  );
}
