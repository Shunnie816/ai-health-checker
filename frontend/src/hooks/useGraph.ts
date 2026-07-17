"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import type { LogListParams } from "@/lib/api";
import { todayString } from "@/lib/format";
import { logsKey } from "@/hooks/useLogs";
import {
  Period,
  GraphPoint,
  GraphSourceLog,
  periodStartDate,
  toGraphPoints,
} from "@/lib/graph";

export type GraphApi = {
  listLogs: (params?: LogListParams) => Promise<GraphSourceLog[]>;
};

/**
 * 選択中の期間分のログのみを取得してグラフ用データに変換する。
 * 期間ごとに SWR でキャッシュされるため、期間切替や再訪問時は即座に表示される。
 */
export function useGraph(api: GraphApi) {
  const [period, setPeriod] = useState<Period>("30d");
  const today = todayString();
  const startDate = periodStartDate(period, today);
  const params: LogListParams | undefined = startDate ? { startDate } : undefined;

  const { data, error, isLoading } = useSWR(logsKey(params), () => api.listLogs(params), {
    keepPreviousData: true,
  });

  const points: GraphPoint[] = useMemo(
    () => toGraphPoints(data ?? [], period, today),
    [data, period, today]
  );

  return {
    points,
    period,
    setPeriod,
    loading: isLoading,
    error: error ? "ログの取得に失敗しました" : null,
  };
}
