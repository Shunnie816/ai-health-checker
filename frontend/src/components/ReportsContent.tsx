"use client";

import Link from "next/link";
import { useState } from "react";
import { listReports, runAnalysis } from "@/lib/api";
import {
  AnalysisPeriod,
  AnalysisReport,
  ANALYSIS_PERIOD_OPTIONS,
  analysisPeriodParams,
} from "@/lib/reports";
import { ReportsApi, useReports } from "@/hooks/useReports";
import { formatDate, todayString } from "@/lib/format";
import { ChevronRightIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyMessage, ErrorBanner, LoadingText } from "@/components/ui/status";

// 参照を安定させるためモジュールレベルで生成する（useReports の effect 再実行防止）
const reportsApi: ReportsApi = { listReports, runAnalysis };

export function ReportsContent() {
  const { reports, loading, running, error, run } = useReports(reportsApi);

  // 分析期間の選択（#106）。デフォルトは直近1か月
  const [period, setPeriod] = useState<AnalysisPeriod>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const canRun =
    period !== "custom" ||
    (customStart !== "" && customEnd !== "" && customStart <= customEnd);

  function handleRun() {
    void run(
      analysisPeriodParams(period, todayString(), {
        startDate: customStart,
        endDate: customEnd,
      })
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">

      <PageHeader
        title="AI分析レポート"
        subtitle="ライフログの傾向分析"
        backHref="/"
        actions={
          <button
            type="button"
            onClick={handleRun}
            disabled={running || !canRun}
            className="cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? "分析中..." : "分析を実行"}
          </button>
        }
      />

      {/* Body */}
      <div className="mx-auto flex w-full max-w-lg flex-col gap-2 px-4 pb-10 pt-3">

        {/* Analysis period selector (#106) */}
        <div className="flex rounded-full border border-border bg-surface-1 p-0.5">
          {ANALYSIS_PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={`flex-1 cursor-pointer rounded-full py-1.5 text-sm font-medium transition-colors ${
                period === option.value ? "bg-primary text-white" : "text-fg-secondary"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {period === "custom" && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-1 p-4">
            <input
              type="date"
              aria-label="開始日"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm text-fg outline-none"
            />
            <span className="shrink-0 text-sm text-fg-muted">〜</span>
            <input
              type="date"
              aria-label="終了日"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm text-fg outline-none"
            />
          </div>
        )}

        {running && (
          <p className="rounded-xl bg-primary-subtle px-4 py-3 text-sm leading-relaxed text-fg-secondary">
            AIが選択した期間のログを分析しています。1分ほどかかることがあります。
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
