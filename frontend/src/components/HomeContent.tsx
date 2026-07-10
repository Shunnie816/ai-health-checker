"use client";

import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { listLogs, LogRecord } from "@/lib/api";
import { getEmotionColor, getFatigueColor, getOvertimeColor } from "@/lib/colors";
import { formatDate, formatMood } from "@/lib/format";
import { ChevronRightIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyMessage, LoadingText } from "@/components/ui/status";

export function HomeContent() {
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">

      <PageHeader
        title="HealthLog"
        subtitle="直近の記録"
        actions={
          <>
            <Link
              href="/graph"
              className="rounded-full border border-[var(--color-border)] px-3.5 py-1.5 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-1)]"
            >
              グラフ
            </Link>
            <Link
              href="/reports"
              className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-white"
              style={{ background: "var(--color-primary)" }}
            >
              AI分析
            </Link>
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="rounded-full border border-[var(--color-border)] px-3.5 py-1.5 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-1)]"
            >
              ログアウト
            </button>
          </>
        }
      />

      {/* Log list */}
      <div className="flex flex-col gap-2 px-4 pb-24 pt-3">
        {loading ? (
          <LoadingText />
        ) : logs.length === 0 ? (
          <EmptyMessage>
            まだログがありません。<br />最初の記録をつけましょう！
          </EmptyMessage>
        ) : (
          logs.map((log) => <LogCard key={log.id} log={log} />)
        )}
      </div>

      {/* FAB */}
      <Link
        href="/logs/new"
        aria-label="新規記録"
        className="fixed bottom-7 right-5 flex h-14 w-14 items-center justify-center rounded-full text-[28px] leading-none text-white shadow-xl"
        style={{ background: "var(--color-primary)" }}
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
      className="flex flex-col gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 no-underline"
    >
      {/* Row 1: date + badge + chevron */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {formatDate(log.date)}
          </span>
          <span className="rounded-full bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">
            {log.is_holiday ? "休日" : "平日"}
          </span>
        </div>
        <ChevronRightIcon />
      </div>

      {/* Row 2: mood / fatigue / overtime */}
      <div className="flex items-center">
        <Metric label="朝の気分" color={moodColor} value={formatMood(log.mood_morning)} />
        <div className="mx-0 h-[30px] w-px shrink-0 bg-[var(--color-border)]" />
        <Metric label="疲れ度" color={fatigueColor} value={String(log.fatigue)} indent />
        <div className="mx-0 h-[30px] w-px shrink-0 bg-[var(--color-border)]" />
        <div className="flex flex-1 flex-col gap-0.5 pl-3.5">
          <span className="text-[11px] text-[var(--color-text-muted)]">残業スコア</span>
          <span className="text-[15px] font-semibold" style={{ color: overtimeColor }}>
            {log.overtime_score !== null ? log.overtime_score : "—"}
          </span>
        </div>
      </div>

      {/* Row 3: work time */}
      {!log.is_holiday && log.work_start && log.work_end && (
        <div className="flex items-center gap-1.5 border-t border-[var(--color-border)] pt-2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 opacity-45">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 3.5V6l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="text-xs text-[var(--color-text-muted)]">
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
      <span className="text-[11px] text-[var(--color-text-muted)]">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        <span className="text-[15px] font-semibold" style={{ color }}>{value}</span>
      </div>
    </div>
  );
}
