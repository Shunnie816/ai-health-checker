"use client";

import { listLogs } from "@/lib/api";
import { PERIOD_OPTIONS } from "@/lib/graph";
import { GraphApi, useGraph } from "@/hooks/useGraph";
import { LogTrendCharts } from "@/components/LogCharts";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyMessage, ErrorBanner, LoadingText } from "@/components/ui/status";

// テストで差し替えられるよう DI で渡す（参照安定のためモジュールレベルで生成）
const graphApi: GraphApi = { listLogs };

export function GraphContent() {
  const { points, period, setPeriod, loading, error } = useGraph(graphApi);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">

      <PageHeader title="グラフ" subtitle="トレンド可視化" backHref="/" containerClassName="max-w-3xl lg:max-w-4xl" />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pb-10 pt-3 lg:max-w-4xl">

        {/* Period selector */}
        <div className="flex rounded-full border border-border bg-surface-1 p-0.5">
          {PERIOD_OPTIONS.map((option) => (
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

        {error && <ErrorBanner>{error}</ErrorBanner>}

        {loading && points.length === 0 ? (
          <LoadingText />
        ) : points.length === 0 && !error ? (
          <EmptyMessage>
            この期間のログがありません。<br />記録をつけてトレンドを確認しましょう。
          </EmptyMessage>
        ) : (
          <LogTrendCharts points={points} />
        )}
      </div>
    </div>
  );
}
