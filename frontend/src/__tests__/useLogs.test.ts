import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLogs, LogsApi } from "@/hooks/useLogs";
import { swrWrapper } from "./helpers/swr";
import { makeLogRecord } from "./helpers/logs";

describe("useLogs", () => {
  it("should fetch logs for the given period", async () => {
    const log = makeLogRecord("2026-07-01");
    const api: LogsApi = { listLogs: vi.fn().mockResolvedValue([log]) };
    const params = { startDate: "2026-06-10" };

    const { result } = renderHook(() => useLogs(params, api), {
      wrapper: swrWrapper,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.logs).toEqual([log]);
    expect(result.current.error).toBeNull();
    expect(api.listLogs).toHaveBeenCalledWith(params);
  });

  it("should not fetch when disabled", () => {
    const api: LogsApi = { listLogs: vi.fn().mockResolvedValue([]) };

    const { result } = renderHook(() => useLogs(undefined, api, false), {
      wrapper: swrWrapper,
    });

    expect(api.listLogs).not.toHaveBeenCalled();
    expect(result.current.logs).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("should set error message when fetching fails", async () => {
    const api: LogsApi = {
      listLogs: vi.fn().mockRejectedValue(new Error("network error")),
    };

    const { result } = renderHook(() => useLogs(undefined, api), {
      wrapper: swrWrapper,
    });

    await waitFor(() =>
      expect(result.current.error).toBe("ログの取得に失敗しました")
    );
    expect(result.current.logs).toEqual([]);
  });
});
