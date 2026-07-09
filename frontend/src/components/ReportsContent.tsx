"use client";

import Link from "next/link";
import { listReports, runAnalysis } from "@/lib/api";
import { AnalysisReport } from "@/lib/reports";
import { ReportsApi, useReports } from "@/hooks/useReports";
import { formatDate } from "@/lib/colors";

// 参照を安定させるためモジュールレベルで生成する（useReports の effect 再実行防止）
const reportsApi: ReportsApi = { listReports, runAnalysis };

export function ReportsContent() {
  const { reports, loading, running, error, run } = useReports(reportsApi);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">

      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)] px-5 pb-3 pt-3.5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="戻る"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-1)]"
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              AI分析レポート
            </h1>
            <p className="mt-0.5 text-[13px] text-[var(--color-text-muted)]">ライフログの傾向分析</p>
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="rounded-full px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-opacity disabled:opacity-60"
          style={{ background: "var(--color-primary)", cursor: running ? "not-allowed" : "pointer" }}
        >
          {running ? "分析中..." : "分析を実行"}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 px-4 pb-10 pt-3">
        {running && (
          <p className="rounded-xl bg-[var(--color-primary-subtle)] px-4 py-3 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
            AIが直近のログを分析しています。1分ほどかかることがあります。
          </p>
        )}
        {error && (
          <p className="rounded-xl bg-[var(--color-danger-subtle)] px-4 py-3 text-[13px] text-[var(--color-danger)]">
            {error}
          </p>
        )}
        {loading ? (
          <p className="mt-12 text-center text-[var(--color-text-muted)]">読み込み中...</p>
        ) : reports.length === 0 && !error ? (
          <p className="mt-12 text-center leading-relaxed text-[var(--color-text-muted)]">
            まだレポートがありません。<br />「分析を実行」で最初のレポートを作成しましょう。
          </p>
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
      className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 no-underline"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {formatDate(report.start_date)} 〜 {formatDate(report.end_date)}
        </span>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="shrink-0 opacity-30">
          <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="line-clamp-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
        {report.content}
      </p>
      <span className="text-[11px] text-[var(--color-text-muted)]">
        対象ログ {report.log_count} 件
      </span>
    </Link>
  );
}
