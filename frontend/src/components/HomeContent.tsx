"use client";

import { signOut } from "firebase/auth";
import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { listLogs, LogRecord } from "@/lib/api";
import { getEmotionColor, getFatigueColor, getOvertimeColor } from "@/lib/colors";
import { formatDate, formatMood, todayString } from "@/lib/format";
import { periodStartDate } from "@/lib/graph";
import { LogsApi, useLogs } from "@/hooks/useLogs";
import { ChevronRightIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyMessage, ErrorBanner, LoadingText } from "@/components/ui/status";

// テストで差し替えられるよう DI で渡す（参照安定のためモジュールレベルで生成）
const logsApi: LogsApi = { listLogs };

export function HomeContent() {
  // 初期表示は直近30日分のみ取得し、「もっと見る」で全期間を取得する（#92）
  const [showAllRequested, setShowAllRequested] = useState(false);
  const recent = useLogs(
    { startDate: periodStartDate("30d", todayString()) },
    logsApi
  );

  // 直近30日が空なら自動で全期間へフォールバックする
  // （新規ユーザーには空メッセージ、古いデータのみのユーザーにはそのデータを表示するため）
  const showAll =
    showAllRequested ||
    (!recent.loading && !recent.error && recent.logs.length === 0);
  const all = useLogs(undefined, logsApi, showAll);

  const { logs, loading, error } = showAll ? all : recent;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">

      <PageHeader
        title="HealthLog"
        subtitle="直近の記録"
        actions={
          <>
            <Link
              href="/graph"
              className="whitespace-nowrap rounded-full border border-border px-3.5 py-1.5 text-sm text-fg-secondary transition-colors hover:bg-surface-1"
            >
              グラフ
            </Link>
            <Link
              href="/reports"
              className="whitespace-nowrap rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-white"
            >
              AI分析
            </Link>
            <button
              type="button"
              onClick={() => signOut(auth)}
              aria-label="ログアウト"
              title="ログアウト"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-fg-secondary transition-colors hover:bg-surface-1"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M6 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H6M10.5 11l3-3-3-3M13.5 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        }
      />

      {/* Log list */}
      <div className="mx-auto flex w-full max-w-lg flex-col gap-2 px-4 pb-24 pt-3">
        {loading && logs.length === 0 ? (
          <LoadingText />
        ) : error && logs.length === 0 ? (
          <ErrorBanner>{error}</ErrorBanner>
        ) : logs.length === 0 ? (
          // 全期間へのフォールバック中は空メッセージを出さない
          showAll ? (
            <EmptyMessage>
              まだログがありません。<br />最初の記録をつけましょう！
            </EmptyMessage>
          ) : (
            <LoadingText />
          )
        ) : (
          <>
            {logs.map((log) => <LogCard key={log.id} log={log} />)}
            {!showAll && (
              <button
                type="button"
                onClick={() => setShowAllRequested(true)}
                className="mt-1 cursor-pointer self-center rounded-full border border-border px-4 py-1.5 text-sm text-fg-secondary transition-colors hover:bg-surface-1"
              >
                過去のログをすべて表示
              </button>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/logs/new"
        aria-label="新規記録"
        className="fixed bottom-7 right-[max(1.25rem,calc(50%-14.75rem))] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-3xl leading-none text-white shadow-xl"
      >
        +
      </Link>
    </div>
  );
}

function LogCard({ log }: { log: LogRecord }) {
  const moodColor = getEmotionColor(log.mood_morning);
  const fatigueColor = getFatigueColor(log.fatigue);
  const overtimeColor = getOvertimeColor(log.overtime_score);

  return (
    <Link
      href={`/logs/${log.id}/edit`}
      className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface-1 p-4 no-underline"
    >
      {/* Row 1: date + badge + chevron */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-fg">
            {formatDate(log.date)}
          </span>
          <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-xs font-medium text-fg-muted">
            {log.is_holiday ? "休日" : "平日"}
          </span>
          {log.fatigue === null && (
            <span className="rounded-full bg-primary-subtle px-1.5 py-0.5 text-xs font-medium text-primary">
              追記待ち
            </span>
          )}
        </div>
        <ChevronRightIcon />
      </div>

      {/* Row 2: mood / fatigue / overtime */}
      <div className="flex items-center">
        <Metric label="朝の気分" color={moodColor} value={formatMood(log.mood_morning)} />
        <div className="mx-0 h-[30px] w-px shrink-0 bg-border" />
        <Metric label="疲れ度" color={fatigueColor} value={log.fatigue !== null ? String(log.fatigue) : "—"} indent />
        <div className="mx-0 h-[30px] w-px shrink-0 bg-border" />
        <div className="flex flex-1 flex-col gap-0.5 pl-3.5">
          <span className="text-xs text-fg-muted">残業スコア</span>
          <span className="text-base font-semibold" style={{ color: overtimeColor }}>
            {log.overtime_score !== null ? log.overtime_score : "—"}
          </span>
        </div>
      </div>

      {/* Row 3: work time */}
      {!log.is_holiday && log.work_start && log.work_end && (
        <div className="flex items-center gap-1.5 border-t border-border pt-2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 opacity-45">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 3.5V6l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="text-xs text-fg-muted">
            {log.work_start} – {log.work_end}
          </span>
        </div>
      )}
    </Link>
  );
}

function Metric({ label, color, value, indent }: { label: string; color: string; value: string; indent?: boolean }) {
  return (
    <div className={`flex flex-1 flex-col gap-0.5 ${indent ? "pl-3.5" : ""}`}>
      <span className="text-xs text-fg-muted">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        <span className="text-base font-semibold" style={{ color }}>{value}</span>
      </div>
    </div>
  );
}
