import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePreviousWorkdayLog } from "@/hooks/usePreviousWorkdayLog";
import { LogsApi } from "@/hooks/useLogs";
import { swrWrapper } from "./helpers/swr";
import { makeLogRecord as makeLog } from "./helpers/logs";

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
