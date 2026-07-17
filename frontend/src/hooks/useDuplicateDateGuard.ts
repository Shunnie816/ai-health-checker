"use client";

import useSWR from "swr";
import { logsKey } from "@/hooks/useLogs";

export type DuplicateGuardLog = { id: string; date: string };

export type DuplicateGuardApi = {
  listLogs: (params: {
    startDate: string;
    endDate: string;
  }) => Promise<DuplicateGuardLog[]>;
};

/**
 * 指定日付のログが既に存在するか調べ、あればその id を返す（新規記録画面用）。
 * 対象日1件のみを照会し、結果は SWR でキャッシュされる。
 * 取得失敗時は null のまま（最終的な重複防止はバックエンドの409が担保する）。
 */
export function useDuplicateDateGuard(
  date: string,
  enabled: boolean,
  api: DuplicateGuardApi
): string | null {
  const { data } = useSWR(
    enabled && date ? logsKey({ startDate: date, endDate: date }) : null,
    () => api.listLogs({ startDate: date, endDate: date })
  );

  return data?.find((log) => log.date === date)?.id ?? null;
}
