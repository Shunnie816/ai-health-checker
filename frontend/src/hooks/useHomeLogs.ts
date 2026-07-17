"use client";

import { useState } from "react";
import { todayString } from "@/lib/format";
import { periodStartDate } from "@/lib/graph";
import { LogsApi, useLogs } from "@/hooks/useLogs";

export type LogPeriodFilter = {
  startDate?: string;
  endDate?: string;
};

/**
 * ホーム画面のログ一覧取得ロジック。
 * - 初期表示は直近30日分のみ取得（#92）
 * - 直近30日が空なら自動で全期間へフォールバック（新規ユーザーには空メッセージ、
 *   古いデータのみのユーザーにはそのデータを表示するため）
 * - requestShowAll() で全期間へ切り替え
 * - setFilter() で期間フィルタを適用（#93）。フィルタ中は上記より優先される
 * api はモジュールレベルなど参照が安定した場所で生成して渡すこと。
 */
export function useHomeLogs(api: LogsApi) {
  const [showAllRequested, setShowAllRequested] = useState(false);
  const [filter, setFilter] = useState<LogPeriodFilter | null>(null);

  const filtering = filter !== null;
  const recent = useLogs(
    { startDate: periodStartDate("30d", todayString()) },
    api,
    !filtering
  );
  const showAll =
    !filtering &&
    (showAllRequested ||
      (!recent.loading && !recent.error && recent.logs.length === 0));
  const all = useLogs(undefined, api, showAll);
  const filtered = useLogs(filter ?? undefined, api, filtering);

  const active = filtering ? filtered : showAll ? all : recent;

  return {
    logs: active.logs,
    loading: active.loading,
    error: active.error,
    showAll,
    requestShowAll: () => setShowAllRequested(true),
    filter,
    setFilter,
  };
}
