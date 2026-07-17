import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useReports, ReportsApi } from "@/hooks/useReports";
import { NoLogsError } from "@/lib/errors";
import { AnalysisReport } from "@/lib/reports";

function makeReport(overrides: Partial<AnalysisReport> = {}): AnalysisReport {
  return {
    id: "report-1",
    user_id: "user-1",
    start_date: "2026-06-01",
    end_date: "2026-06-30",
    content: "疲労度と残業時間に相関が見られます。",
    log_count: 20,
    focus: "general",
    created_at: "2026-06-30T00:00:00Z",
    ...overrides,
  };
}

function makeApi(overrides: Partial<ReportsApi> = {}): ReportsApi {
  return {
    listReports: vi.fn().mockResolvedValue([]),
    runAnalysis: vi.fn().mockResolvedValue(makeReport()),
    ...overrides,
  };
}

describe("useReports", () => {
  it("should load reports on mount", async () => {
    const existing = makeReport({ id: "existing" });
    const api = makeApi({
      listReports: vi.fn().mockResolvedValue([existing]),
    });

    const { result } = renderHook(() => useReports(api));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reports).toEqual([existing]);
    expect(result.current.error).toBeNull();
  });

  it("should set error message when loading reports fails", async () => {
    const api = makeApi({
      listReports: vi.fn().mockRejectedValue(new Error("network error")),
    });

    const { result } = renderHook(() => useReports(api));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("レポートの取得に失敗しました");
  });

  it("should prepend new report to the list when run succeeds", async () => {
    const existing = makeReport({ id: "existing" });
    const created = makeReport({ id: "created" });
    const api = makeApi({
      listReports: vi.fn().mockResolvedValue([existing]),
      runAnalysis: vi.fn().mockResolvedValue(created),
    });

    const { result } = renderHook(() => useReports(api));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.run();
    });

    expect(result.current.reports).toEqual([created, existing]);
    expect(result.current.error).toBeNull();
  });

  it("should pass selected period params to runAnalysis", async () => {
    const api = makeApi();
    const params = { startDate: "2026-07-01", endDate: "2026-07-17" };

    const { result } = renderHook(() => useReports(api));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.run(params);
    });

    expect(api.runAnalysis).toHaveBeenCalledWith(params);
  });

  it("should set no-logs message when run fails with NoLogsError", async () => {
    const api = makeApi({
      runAnalysis: vi.fn().mockRejectedValue(new NoLogsError()),
    });

    const { result } = renderHook(() => useReports(api));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.run();
    });

    expect(result.current.error).toBe(
      "分析対象期間にログがありません。まずはログを記録しましょう。"
    );
    expect(result.current.reports).toEqual([]);
  });

  it("should set generic error message when run fails unexpectedly", async () => {
    const api = makeApi({
      runAnalysis: vi.fn().mockRejectedValue(new Error("server error")),
    });

    const { result } = renderHook(() => useReports(api));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.run();
    });

    expect(result.current.error).toBe("分析の実行に失敗しました");
  });

  it("should clear previous error when run succeeds", async () => {
    const created = makeReport({ id: "created" });
    const runAnalysis = vi
      .fn()
      .mockRejectedValueOnce(new NoLogsError())
      .mockResolvedValueOnce(created);
    const api = makeApi({ runAnalysis });

    const { result } = renderHook(() => useReports(api));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.run();
    });
    expect(result.current.error).not.toBeNull();

    await act(async () => {
      await result.current.run();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.reports).toEqual([created]);
  });
});
