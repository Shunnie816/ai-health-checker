"use client";

import { useCallback, useEffect, useState } from "react";
import { AnalysisReport, NoLogsError } from "@/lib/reports";

export type ReportsApi = {
  listReports: () => Promise<AnalysisReport[]>;
  runAnalysis: () => Promise<AnalysisReport>;
};

// api はモジュールレベルなど参照が安定した場所で生成して渡すこと。
// レンダーごとに新しいオブジェクトを渡すと一覧取得の effect が毎回再実行される。
export function useReports(api: ReportsApi) {
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listReports()
      .then((data) => {
        if (!cancelled) setReports(data);
      })
      .catch(() => {
        if (!cancelled) setError("レポートの取得に失敗しました");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const report = await api.runAnalysis();
      setReports((prev) => [report, ...prev]);
    } catch (err) {
      if (err instanceof NoLogsError) {
        setError("分析対象期間にログがありません。まずはログを記録しましょう。");
      } else {
        setError("分析の実行に失敗しました");
      }
    } finally {
      setRunning(false);
    }
  }, [api]);

  return { reports, loading, running, error, run };
}
