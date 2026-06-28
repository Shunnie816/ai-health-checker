"use client";

import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { listLogs, LogRecord } from "@/lib/api";
import { getEmotionColor, getFatigueColor, getOvertimeColor, formatMood, formatDate } from "@/lib/colors";

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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--color-bg)" }}>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)",
        padding: "14px 20px 12px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.4px" }}>
            HealthLog
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "2px" }}>直近の記録</p>
        </div>
        <button
          type="button"
          onClick={() => signOut(auth)}
          style={{
            padding: "6px 14px", fontSize: "13px", cursor: "pointer",
            border: "1px solid var(--color-border)", borderRadius: "var(--radius-full)",
            background: "transparent", color: "var(--color-text-secondary)",
            fontFamily: "inherit",
          }}
        >
          ログアウト
        </button>
      </div>

      {/* Log list */}
      <div style={{ padding: "12px 16px 100px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", marginTop: "3rem" }}>読み込み中...</p>
        ) : logs.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", marginTop: "3rem", lineHeight: 1.6 }}>
            まだログがありません。<br />最初の記録をつけましょう！
          </p>
        ) : (
          logs.map((log) => <LogCard key={log.id} log={log} />)
        )}
      </div>

      {/* FAB */}
      <Link
        href="/logs/new"
        style={{
          position: "fixed", right: "20px", bottom: "28px",
          width: "56px", height: "56px", borderRadius: "50%",
          background: "var(--color-primary)",
          color: "white", fontSize: "28px", lineHeight: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.22)",
          textDecoration: "none",
        }}
        aria-label="新規記録"
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
      style={{
        background: "var(--color-surface-1)", borderRadius: "12px",
        padding: "14px 16px", border: "1px solid var(--color-border)",
        display: "flex", flexDirection: "column", gap: "10px",
        textDecoration: "none",
      }}
    >
      {/* Row 1: date + badge + chevron */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>
            {formatDate(log.date)}
          </span>
          <span style={{
            fontSize: "11px", padding: "2px 7px", borderRadius: "999px",
            background: "var(--color-surface-2)", color: "var(--color-text-muted)", fontWeight: 500,
          }}>
            {log.is_holiday ? "休日" : "平日"}
          </span>
        </div>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
          <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Row 2: mood / fatigue / overtime */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Metric label="朝の気分" color={moodColor} value={formatMood(log.mood_morning)} />
        <div style={{ width: "1px", height: "30px", background: "var(--color-border)", flexShrink: 0 }} />
        <Metric label="疲れ度" color={fatigueColor} value={String(log.fatigue)} indent />
        <div style={{ width: "1px", height: "30px", background: "var(--color-border)", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px", paddingLeft: "14px" }}>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>残業スコア</span>
          <span style={{ fontSize: "15px", fontWeight: 600, color: overtimeColor }}>
            {log.overtime_score !== null ? log.overtime_score : "—"}
          </span>
        </div>
      </div>

      {/* Row 3: work time */}
      {!log.is_holiday && log.work_start && log.work_end && (
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          paddingTop: "8px", borderTop: "1px solid var(--color-border)", marginTop: "2px",
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.45 }}>
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 3.5V6l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {log.work_start} – {log.work_end}
          </span>
        </div>
      )}
    </Link>
  );
}

function Metric({ label, color, value, indent }: { label: string; color: string; value: string; indent?: boolean }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px", paddingLeft: indent ? "14px" : 0 }}>
      <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, flexShrink: 0 }} />
        <span style={{ fontSize: "15px", fontWeight: 600, color }}>{value}</span>
      </div>
    </div>
  );
}
