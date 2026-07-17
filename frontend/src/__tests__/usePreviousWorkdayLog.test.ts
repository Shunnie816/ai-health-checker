import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePreviousWorkdayLog } from "@/hooks/usePreviousWorkdayLog";
import { LogsApi } from "@/hooks/useLogs";
import type { LogRecord } from "@/lib/api";
import { swrWrapper } from "./helpers/swr";

function makeLog(date: string, overrides: Partial<LogRecord> = {}): LogRecord {
  return {
    id: `log-${date}`,
    user_id: "user-1",
    date,
    is_holiday: false,
    mood_morning: 2,
    mood_after_work: 1,
    fatigue: 3,
    comment: null,
    work_content: "APIの実装",
    work_start: "09:00",
    work_end: "18:00",
    gym: false,
    overtime_minutes: 0,
    overtime_score: 0,
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

describe("usePreviousWorkdayLog", () => {
  it("should return the latest workday log before the date", async () => {
    const api: LogsApi = {
      listLogs: vi
        .fn()
        .mockResolvedValue([makeLog("2026-07-01"), makeLog("2026-06-30")]),
    };

    const { result } = renderHook(
      () => usePreviousWorkdayLog("2026-07-02", true, api),
      { wrapper: swrWrapper }
    );

    await waitFor(() => expect(result.current?.date).toBe("2026-07-01"));
    // 照会範囲は前日〜14日前に絞られる
    expect(api.listLogs).toHaveBeenCalledWith({
      startDate: "2026-06-18",
      endDate: "2026-07-01",
    });
  });

  it("should skip holiday logs and return the latest workday log", async () => {
    const api: LogsApi = {
      listLogs: vi
        .fn()
        .mockResolvedValue([
          makeLog("2026-07-01", { is_holiday: true }),
          makeLog("2026-06-30"),
        ]),
    };

    const { result } = renderHook(
      () => usePreviousWorkdayLog("2026-07-02", true, api),
      { wrapper: swrWrapper }
    );

    await waitFor(() => expect(result.current?.date).toBe("2026-06-30"));
  });

  it("should return null when no workday log exists in the lookback window", async () => {
    const api: LogsApi = { listLogs: vi.fn().mockResolvedValue([]) };

    const { result } = renderHook(
      () => usePreviousWorkdayLog("2026-07-02", true, api),
      { wrapper: swrWrapper }
    );

    await waitFor(() => expect(api.listLogs).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  it("should not fetch when disabled", () => {
    const api: LogsApi = { listLogs: vi.fn().mockResolvedValue([]) };

    const { result } = renderHook(
      () => usePreviousWorkdayLog("2026-07-02", false, api),
      { wrapper: swrWrapper }
    );

    expect(api.listLogs).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });
});
