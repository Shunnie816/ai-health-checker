"use client";

import useSWR from "swr";
import type { LogRecord } from "@/lib/api";
import { addDaysString } from "@/lib/format";
import { logsKey, LogsApi } from "@/hooks/useLogs";

/** 前回の勤務日ログを探す範囲（日数）。連休明けでも直近の勤務日を拾えるようにする */
const LOOKBACK_DAYS = 14;

/**
 * 指定日より前の直近の勤務日（休日以外）ログを返す（「前回と同じ内容を入力」用）。
 * 直近 LOOKBACK_DAYS 日以内に勤務日ログがなければ null。
 * api はモジュールレベルなど参照が安定した場所で生成して渡すこと。
 */
export function usePreviousWorkdayLog(
  date: string,
  enabled: boolean,
  api: LogsApi
): LogRecord | null {
  const params = date
    ? {
        startDate: addDaysString(date, -LOOKBACK_DAYS),
        endDate: addDaysString(date, -1),
      }
    : undefined;

  const { data } = useSWR(enabled && date ? logsKey(params) : null, () =>
    api.listLogs(params)
  );

  if (!data) return null;
  return (
    [...data]
      .filter((log) => !log.is_holiday)
      .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
  );
}
