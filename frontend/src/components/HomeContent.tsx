"use client";

import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { listLogs, LogRecord } from "@/lib/api";

export function HomeContent() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <main style={styles.main}>
      <div style={styles.header}>
        <h1 style={styles.heading}>AI Health Checker</h1>
        <div style={styles.headerRight}>
          <span style={styles.greeting}>
            {user?.displayName ?? user?.email}
          </span>
          <button type="button" onClick={handleSignOut} style={styles.signOutBtn}>
            ログアウト
          </button>
        </div>
      </div>

      <div style={styles.actions}>
        <Link href="/logs/new" style={styles.newLogBtn}>
          + 今日のログを記録
        </Link>
      </div>

      <section>
        {loading ? (
          <p style={styles.info}>読み込み中...</p>
        ) : logs.length === 0 ? (
          <p style={styles.info}>まだログがありません。最初の記録をつけましょう！</p>
        ) : (
          <ul style={styles.list}>
            {logs.map((log) => (
              <li key={log.id} style={styles.logItem}>
                <div style={styles.logMain}>
                  <span style={styles.logDate}>{log.date}</span>
                  {log.is_holiday && (
                    <span style={styles.holidayBadge}>休日</span>
                  )}
                  <span style={styles.logMood}>気分 {log.mood_morning > 0 ? `+${log.mood_morning}` : log.mood_morning}</span>
                  <span style={styles.logFatigue}>疲労 {log.fatigue}</span>
                  {log.overtime_score !== null && (
                    <span style={styles.logOvertime}>残業 {log.overtime_score}</span>
                  )}
                  {log.gym && <span style={styles.gymBadge}>ジム</span>}
                </div>
                <Link href={`/logs/${log.id}/edit`} style={styles.editLink}>
                  編集
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

const styles = {
  main: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "1.5rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  heading: {
    fontSize: "1.25rem",
    fontWeight: "bold",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  greeting: {
    fontSize: "0.875rem",
    color: "#555",
  },
  signOutBtn: {
    padding: "0.375rem 0.75rem",
    fontSize: "0.875rem",
    cursor: "pointer",
    border: "1px solid #ccc",
    borderRadius: "4px",
    background: "#fff",
  },
  actions: {
    marginBottom: "1.5rem",
  },
  newLogBtn: {
    display: "inline-block",
    padding: "0.625rem 1.25rem",
    background: "#333",
    color: "#fff",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "0.9375rem",
  },
  info: {
    color: "#666",
    textAlign: "center" as const,
    marginTop: "2rem",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  logItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1rem",
    border: "1px solid #e5e5e5",
    borderRadius: "6px",
    background: "#fafafa",
  },
  logMain: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
  },
  logDate: {
    fontWeight: "600",
    fontSize: "0.9375rem",
  },
  holidayBadge: {
    fontSize: "0.75rem",
    background: "#e0f0ff",
    color: "#0055aa",
    padding: "0.125rem 0.375rem",
    borderRadius: "3px",
  },
  logMood: {
    fontSize: "0.8125rem",
    color: "#555",
  },
  logFatigue: {
    fontSize: "0.8125rem",
    color: "#555",
  },
  logOvertime: {
    fontSize: "0.8125rem",
    color: "#c55",
  },
  gymBadge: {
    fontSize: "0.75rem",
    background: "#e8f5e8",
    color: "#2a7a2a",
    padding: "0.125rem 0.375rem",
    borderRadius: "3px",
  },
  editLink: {
    fontSize: "0.8125rem",
    color: "#555",
    textDecoration: "none",
    padding: "0.25rem 0.5rem",
    border: "1px solid #ddd",
    borderRadius: "3px",
  },
};
