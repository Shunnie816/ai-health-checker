"use client";

import { signOut } from "firebase/auth";
import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { listLogs, LogRecord } from "@/lib/api";
import { getEmotionColor, getFatigueColor, getOvertimeColor } from "@/lib/colors";
import { formatDate, formatMood } from "@/lib/format";
import { LogsApi } from "@/hooks/useLogs";
import { useHomeLogs } from "@/hooks/useHomeLogs";
import { ChevronRightIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyMessage, ErrorBanner, LoadingText } from "@/components/ui/status";

// テストで差し替えられるよう DI で渡す（参照安定のためモジュールレベルで生成）
const logsApi: LogsApi = { listLogs };

export function HomeContent() {
  const { logs, loading, error, showAll, requestShowAll, filter, setFilter } =
    useHomeLogs(logsApi);

  // 期間フィルタの入力欄（適用前のドラフト値）
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");

  const canApplyFilter =
    (draftStart !== "" || draftEnd !== "") &&
    !(draftStart !== "" && draftEnd !== "" && draftStart > draftEnd);

  function applyFilter() {
    setFilter({
      startDate: draftStart || undefined,
      endDate: draftEnd || undefined,
    });
  }

  function clearFilter() {
    setDraftStart("");
    setDraftEnd("");
    setFilter(null);
    setFilterOpen(false);
  }

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

        {/* Period filter (#93) */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            className="cursor-pointer p-0 text-sm font-medium text-primary"
          >
            期間で絞り込む
          </button>
        </div>
        {(filterOpen || filter !== null) && (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-1 p-4">
            <div className="flex items-center gap-2">
              <input
                type="date"
                aria-label="開始日"
                value={draftStart}
                onChange={(e) => setDraftStart(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm text-fg outline-none"
              />
              <span className="shrink-0 text-sm text-fg-muted">〜</span>
              <input
                type="date"
                aria-label="終了日"
                value={draftEnd}
                onChange={(e) => setDraftEnd(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm text-fg outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applyFilter}
                disabled={!canApplyFilter}
                className="flex-1 cursor-pointer rounded-full bg-primary py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                絞り込む
              </button>
              {filter !== null && (
                <button
                  type="button"
                  onClick={clearFilter}
                  className="flex-1 cursor-pointer rounded-full border border-border py-1.5 text-sm text-fg-secondary transition-colors hover:bg-surface-2"
                >
                  クリア
                </button>
              )}
            </div>
          </div>
        )}

        {loading && logs.length === 0 ? (
          <LoadingText />
        ) : error && logs.length === 0 ? (
          <ErrorBanner>{error}</ErrorBanner>
        ) : logs.length === 0 ? (
          filter !== null ? (
            <EmptyMessage>この期間の記録はありません。</EmptyMessage>
          ) : showAll ? (
            <EmptyMessage>
              まだログがありません。<br />最初の記録をつけましょう！
            </EmptyMessage>
          ) : (
            // 全期間へのフォールバック中は空メッセージを出さない
            <LoadingText />
          )
        ) : (
          <>
            {logs.map((log) => <LogCard key={log.id} log={log} />)}
            {!showAll && filter === null && (
              <button
                type="button"
                onClick={requestShowAll}
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
