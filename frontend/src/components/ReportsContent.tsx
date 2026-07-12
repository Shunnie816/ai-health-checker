"use client";

import Link from "next/link";
import { listReports, runAnalysis } from "@/lib/api";
import { AnalysisReport } from "@/lib/reports";
import { ReportsApi, useReports } from "@/hooks/useReports";
import { formatDate } from "@/lib/format";
import { ChevronRightIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyMessage, ErrorBanner, LoadingText } from "@/components/ui/status";

// 参照を安定させるためモジュールレベルで生成する（useReports の effect 再実行防止）
const reportsApi: ReportsApi = { listReports, runAnalysis };

export function ReportsContent() {
  const { reports, loading, running, error, run } = useReports(reportsApi);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">

      <PageHeader
        title="AI分析レポート"
        subtitle="ライフログの傾向分析"
        backHref="/"
        actions={
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? "分析中..." : "分析を実行"}
          </button>
        }
      />

      {/* Body */}
      <div className="flex flex-col gap-2 px-4 pb-10 pt-3">
        {running && (
          <p className="rounded-xl bg-primary-subtle px-4 py-3 text-sm leading-relaxed text-fg-secondary">
            AIが直近のログを分析しています。1分ほどかかることがあります。
          </p>
        )}
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {loading ? (
          <LoadingText />
        ) : reports.length === 0 && !error ? (
          <EmptyMessage>
            まだレポートがありません。<br />「分析を実行」で最初のレポートを作成しましょう。
          </EmptyMessage>
        ) : (
          reports.map((report) => <ReportCard key={report.id} report={report} />)
        )}
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: AnalysisReport }) {
  return (
    <Link
      href={`/reports/${report.id}`}
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface-1 p-4 no-underline"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-fg">
          {formatDate(report.start_date)} 〜 {formatDate(report.end_date)}
        </span>
        <ChevronRightIcon />
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-fg-secondary">
        {report.content}
      </p>
      <span className="text-xs text-fg-muted">
        対象ログ {report.log_count} 件
      </span>
    </Link>
  );
}
