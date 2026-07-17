"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { LogTrendCharts } from "@/components/LogCharts";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingText } from "@/components/ui/status";
import { listLogs, listReports } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { analysisFocusLabel } from "@/lib/reports";
import { ReportDetailApi, useReportDetail } from "@/hooks/useReportDetail";

type Props = {
  params: Promise<{ id: string }>;
};

// 参照を安定させるためモジュールレベルで生成する（useReportDetail の effect 再実行防止）
const reportDetailApi: ReportDetailApi = { listReports, listLogs };

function ReportDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { report, loading, notFound, points } = useReportDetail(
    reportDetailApi,
    id
  );

  useEffect(() => {
    if (notFound) router.replace("/reports");
  }, [notFound, router]);

  if (loading) return <LoadingText />;
  if (!report) return null;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">

      <PageHeader
        title={`${formatDate(report.start_date)} 〜 ${formatDate(report.end_date)}`}
        subtitle={`${analysisFocusLabel(report.focus)} / 対象ログ ${report.log_count} 件`}
        backHref="/reports"
        titleClassName="text-lg"
      />

      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-5 pb-10 pt-4">

        {/* Report body */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">
          {report.content}
        </p>

        {/* Period charts (log data aggregated on the client) */}
        {points.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-fg-secondary">
              期間中の推移
            </h2>
            <LogTrendCharts points={points} />
          </section>
        )}
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
