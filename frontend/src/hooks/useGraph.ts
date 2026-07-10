"use client";

import { useEffect, useMemo, useState } from "react";
import { todayString } from "@/lib/format";
import { Period, GraphPoint, GraphSourceLog, toGraphPoints } from "@/lib/graph";

export type GraphApi = {
  listLogs: () => Promise<GraphSourceLog[]>;
};

// api はモジュールレベルなど参照が安定した場所で生成して渡すこと。
// レンダーごとに新しいオブジェクトを渡すと一覧取得の effect が毎回再実行される。
export function useGraph(api: GraphApi) {
  const [logs, setLogs] = useState<GraphSourceLog[]>([]);
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

  const points: GraphPoint[] = useMemo(
    () => toGraphPoints(logs, period, todayString()),
    [logs, period]
  );

  return { points, period, setPeriod, loading, error };
}
