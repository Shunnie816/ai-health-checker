"use client";

import { useEffect, useState } from "react";
import { todayString } from "@/lib/format";
import { GraphPoint, GraphSourceLog, toGraphPoints } from "@/lib/graph";
import { AnalysisReport } from "@/lib/reports";

export type ReportDetailApi = {
  listReports: () => Promise<AnalysisReport[]>;
  listLogs: (params?: {
    startDate?: string;
    endDate?: string;
  }) => Promise<GraphSourceLog[]>;
};

// api はモジュールレベルなど参照が安定した場所で生成して渡すこと。
// レンダーごとに新しいオブジェクトを渡すと取得の effect が毎回再実行される。
export function useReportDetail(api: ReportDetailApi, id: string) {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [points, setPoints] = useState<GraphPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .listReports()
      .then((reports) => {
        if (cancelled) return;
        const found = reports.find((r) => r.id === id);
        if (found) {
          setReport(found);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, id]);

  useEffect(() => {
    if (!report) return;
    let cancelled = false;
    api
      .listLogs({ startDate: report.start_date, endDate: report.end_date })
      .then((logs) => {
        if (!cancelled) setPoints(toGraphPoints(logs, "all", todayString()));
      })
      .catch(() => {
        // グラフは補助情報のため、取得失敗時は非表示のままレポート本文を優先する
      });
    return () => {
      cancelled = true;
    };
  }, [api, report]);

  return { report, loading, notFound, points };
}
