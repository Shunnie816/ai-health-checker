"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { LogForm } from "@/components/LogForm";
import { LoadingText } from "@/components/ui/status";
import { getLog, LogRecord } from "@/lib/api";

type Props = {
  params: Promise<{ id: string }>;
};

function EditLogContent({ id }: { id: string }) {
  const router = useRouter();
  const [log, setLog] = useState<LogRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLog(id)
      .then((found) => {
        if (!found) {
          router.replace("/");
          return;
        }
        setLog(found);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <LoadingText />;
  if (!log) return null;
  return <LogForm existingLog={log} />;
}

export default function EditLogPage({ params }: Props) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <EditLogContent id={id} />
    </AuthGuard>
  );
}
