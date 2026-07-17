import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useHomeLogs } from "@/hooks/useHomeLogs";
import { LogsApi } from "@/hooks/useLogs";
import type { LogListParams } from "@/lib/api";
import { todayString } from "@/lib/format";
import { swrWrapper } from "./helpers/swr";
import { makeLogRecord } from "./helpers/logs";

const recentLog = makeLogRecord(todayString());
const oldLog = makeLogRecord("2020-01-01");

describe("useHomeLogs", () => {
  it("should fetch only the recent 30 days by default", async () => {
    const api: LogsApi = { listLogs: vi.fn().mockResolvedValue([recentLog]) };

    const { result } = renderHook(() => useHomeLogs(api), {
      wrapper: swrWrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.logs).toEqual([recentLog]);
    expect(result.current.showAll).toBe(false);
    expect(api.listLogs).toHaveBeenCalledTimes(1);
    expect(api.listLogs).toHaveBeenCalledWith({
      startDate: expect.any(String),
    });
  });

  it("should fall back to all logs when the recent window is empty", async () => {
    const api: LogsApi = {
      listLogs: vi
        .fn()
        .mockImplementation(async (params?: LogListParams) =>
          params?.startDate ? [] : [oldLog]
        ),
    };

    const { result } = renderHook(() => useHomeLogs(api), {
      wrapper: swrWrapper,
    });

    await waitFor(() => expect(result.current.logs).toEqual([oldLog]));
    expect(result.current.showAll).toBe(true);
  });

  it("should fetch all logs when requestShowAll is called", async () => {
    const api: LogsApi = {
      listLogs: vi
        .fn()
        .mockImplementation(async (params?: LogListParams) =>
          params?.startDate ? [recentLog] : [oldLog, recentLog]
        ),
    };

    const { result } = renderHook(() => useHomeLogs(api), {
      wrapper: swrWrapper,
    });
    await waitFor(() => expect(result.current.logs).toEqual([recentLog]));

    act(() => result.current.requestShowAll());

    await waitFor(() => expect(result.current.logs).toHaveLength(2));
    expect(result.current.showAll).toBe(true);
  });

  it("should fetch only the filtered period when a filter is applied", async () => {
    const filteredLog = makeLogRecord("2026-05-10");
    const api: LogsApi = {
      listLogs: vi
        .fn()
        .mockImplementation(async (params?: LogListParams) =>
          params?.endDate ? [filteredLog] : [recentLog]
        ),
    };

    const { result } = renderHook(() => useHomeLogs(api), {
      wrapper: swrWrapper,
    });
    await waitFor(() => expect(result.current.logs).toEqual([recentLog]));

    act(() =>
      result.current.setFilter({
        startDate: "2026-05-01",
        endDate: "2026-05-31",
      })
    );

    await waitFor(() => expect(result.current.logs).toEqual([filteredLog]));
    expect(api.listLogs).toHaveBeenLastCalledWith({
      startDate: "2026-05-01",
      endDate: "2026-05-31",
    });
  });

  it("should return to the default view when the filter is cleared", async () => {
    const filteredLog = makeLogRecord("2026-05-10");
    const api: LogsApi = {
      listLogs: vi
        .fn()
        .mockImplementation(async (params?: LogListParams) =>
          params?.endDate ? [filteredLog] : [recentLog]
        ),
    };

    const { result } = renderHook(() => useHomeLogs(api), {
      wrapper: swrWrapper,
    });
    await waitFor(() => expect(result.current.logs).toEqual([recentLog]));

    act(() =>
      result.current.setFilter({
        startDate: "2026-05-01",
        endDate: "2026-05-31",
      })
    );
    await waitFor(() => expect(result.current.logs).toEqual([filteredLog]));

    act(() => result.current.setFilter(null));

    await waitFor(() => expect(result.current.logs).toEqual([recentLog]));
    expect(result.current.filter).toBeNull();
  });
});
