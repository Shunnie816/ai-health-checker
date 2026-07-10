"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingText } from "@/components/ui/status";
import { AnalysisReport, listReports } from "@/lib/api";
import { formatDate } from "@/lib/format";

type Props = {
  params: Promise<{ id: string }>;
};

function ReportDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listReports()
      .then((reports) => {
        const found = reports.find((r) => r.id === id);
        if (!found) {
          router.replace("/reports");
          return;
        }
        setReport(found);
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <LoadingText />;
  if (!report) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">

      <PageHeader
        title={`${formatDate(report.start_date)} 〜 ${formatDate(report.end_date)}`}
        subtitle={`対象ログ ${report.log_count} 件`}
        backHref="/reports"
        titleClassName="text-lg"
      />

      {/* Report body */}
      <div className="px-5 pb-10 pt-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-primary)]">
          {report.content}
        </p>
      </div>
    </div>
  );
}

export default function ReportDetailPage({ params }: Props) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <ReportDetailContent id={id} />
    </AuthGuard>
  );
}
