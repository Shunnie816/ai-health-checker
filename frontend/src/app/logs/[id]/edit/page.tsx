"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { LogForm } from "@/components/LogForm";
import { listLogs, LogRecord } from "@/lib/api";

type Props = {
  params: Promise<{ id: string }>;
};

function EditLogContent({ id }: { id: string }) {
  const router = useRouter();
  const [log, setLog] = useState<LogRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listLogs()
      .then((logs) => {
        const found = logs.find((l) => l.id === id);
        if (!found) {
          router.replace("/");
          return;
        }
        setLog(found);
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <p style={{ textAlign: "center", marginTop: "2rem" }}>読み込み中...</p>;
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
