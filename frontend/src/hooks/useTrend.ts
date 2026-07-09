"use client";

import { useEffect, useMemo, useState } from "react";
import { Period, TrendPoint, TrendSourceLog, toTrendPoints } from "@/lib/trend";

export type TrendApi = {
  listLogs: () => Promise<TrendSourceLog[]>;
};

function todayString(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// api はモジュールレベルなど参照が安定した場所で生成して渡すこと。
// レンダーごとに新しいオブジェクトを渡すと一覧取得の effect が毎回再実行される。
export function useTrend(api: TrendApi) {
  const [logs, setLogs] = useState<TrendSourceLog[]>([]);
  const [period, setPeriod] = useState<Period>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listLogs()
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .catch(() => {
        if (!cancelled) setError("ログの取得に失敗しました");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const points: TrendPoint[] = useMemo(
    () => toTrendPoints(logs, period, todayString()),
    [logs, period]
  );

  return { points, period, setPeriod, loading, error };
}
