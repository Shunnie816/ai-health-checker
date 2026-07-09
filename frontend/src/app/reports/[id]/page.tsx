"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { AnalysisReport, listReports } from "@/lib/api";
import { formatDate } from "@/lib/colors";

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

  if (loading) return <p className="mt-12 text-center text-[var(--color-text-muted)]">読み込み中...</p>;
  if (!report) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">

      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-5 pb-3 pt-3.5">
        <Link
          href="/reports"
          aria-label="戻る"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-1)]"
        >
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
            {formatDate(report.start_date)} 〜 {formatDate(report.end_date)}
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--color-text-muted)]">
            対象ログ {report.log_count} 件
          </p>
        </div>
      </div>

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
