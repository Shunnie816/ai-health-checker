import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useReportDetail, ReportDetailApi } from "@/hooks/useReportDetail";
import { GraphSourceLog } from "@/lib/graph";
import { AnalysisReport } from "@/lib/reports";

const REPORT_ID = "report-1";
const START_DATE = "2026-06-01";
const END_DATE = "2026-06-30";

function makeReport(overrides: Partial<AnalysisReport> = {}): AnalysisReport {
  return {
    id: REPORT_ID,
    user_id: "user-1",
    start_date: START_DATE,
    end_date: END_DATE,
    content: "疲労度と残業時間に相関が見られます。",
    focus: "general",
    log_count: 2,
    created_at: "2026-06-30T00:00:00Z",
    ...overrides,
  };
}

function makeLog(overrides: Partial<GraphSourceLog> = {}): GraphSourceLog {
  return {
    date: "2026-06-10",
    mood_morning: 3,
    mood_after_work: 1,
    fatigue: 2,
    overtime_score: 3,
    ...overrides,
  };
}

function makeApi(overrides: Partial<ReportDetailApi> = {}): ReportDetailApi {
  return {
    listReports: vi.fn().mockResolvedValue([makeReport()]),
    listLogs: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("useReportDetail", () => {
  it("should return report when id exists in the list", async () => {
    const report = makeReport();
    const api = makeApi({ listReports: vi.fn().mockResolvedValue([report]) });

    const { result } = renderHook(() => useReportDetail(api, REPORT_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.report).toEqual(report);
    expect(result.current.notFound).toBe(false);
  });

  it("should set notFound when id does not exist in the list", async () => {
    const api = makeApi({
      listReports: vi.fn().mockResolvedValue([makeReport({ id: "other" })]),
    });

    const { result } = renderHook(() => useReportDetail(api, REPORT_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.report).toBeNull();
    expect(result.current.notFound).toBe(true);
  });

  it("should set notFound when loading reports fails", async () => {
    const api = makeApi({
      listReports: vi.fn().mockRejectedValue(new Error("network error")),
    });

    const { result } = renderHook(() => useReportDetail(api, REPORT_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notFound).toBe(true);
  });

  it("should fetch logs for the report period and build ascending chart points", async () => {
    const listLogs = vi
      .fn()
      .mockResolvedValue([
        makeLog({ date: "2026-06-20" }),
        makeLog({ date: "2026-06-10" }),
      ]);
    const api = makeApi({ listLogs });

    const { result } = renderHook(() => useReportDetail(api, REPORT_ID));

    await waitFor(() => expect(result.current.points).toHaveLength(2));
    expect(listLogs).toHaveBeenCalledWith({
      startDate: START_DATE,
      endDate: END_DATE,
    });
    expect(result.current.points.map((p) => p.date)).toEqual([
      "2026-06-10",
      "2026-06-20",
    ]);
    expect(result.current.points[0].label).toBe("6/10");
  });

  it("should keep points empty when loading logs fails", async () => {
    const api = makeApi({
      listLogs: vi.fn().mockRejectedValue(new Error("network error")),
    });

    const { result } = renderHook(() => useReportDetail(api, REPORT_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.report).not.toBeNull();
    expect(result.current.points).toEqual([]);
  });
});
