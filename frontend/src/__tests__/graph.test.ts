import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { GraphSourceLog, toGraphPoints } from "@/lib/graph";
import { useGraph, GraphApi } from "@/hooks/useGraph";

const TODAY = "2026-07-09";

function makeLog(date: string, overrides: Partial<GraphSourceLog> = {}): GraphSourceLog {
  return {
    date,
    mood_morning: 2,
    mood_after_work: -1,
    fatigue: 3,
    overtime_score: 1,
    ...overrides,
  };
}

describe("toGraphPoints", () => {
  it("should sort points by date ascending", () => {
    const logs = [makeLog("2026-07-05"), makeLog("2026-07-01"), makeLog("2026-07-03")];

    const points = toGraphPoints(logs, "all", TODAY);

    expect(points.map((p) => p.date)).toEqual([
      "2026-07-01",
      "2026-07-03",
      "2026-07-05",
    ]);
  });

  it("should include logs exactly 30 days ago and exclude older ones for 30d period", () => {
    const logs = [
      makeLog("2026-06-10"), // ちょうど30日前（today含む30日間の初日）
      makeLog("2026-06-09"), // 31日前
      makeLog(TODAY),
    ];

    const points = toGraphPoints(logs, "30d", TODAY);

    expect(points.map((p) => p.date)).toEqual(["2026-06-10", TODAY]);
  });

  it("should return all logs for all period", () => {
    const logs = [makeLog("2020-01-01"), makeLog(TODAY)];

    const points = toGraphPoints(logs, "all", TODAY);

    expect(points).toHaveLength(2);
  });

  it("should format label as M/D without zero padding", () => {
    const points = toGraphPoints([makeLog("2026-07-05")], "all", TODAY);

    expect(points[0].label).toBe("7/5");
  });

  it("should keep null fields for holiday logs", () => {
    const holidayLog = makeLog(TODAY, {
      mood_after_work: null,
      overtime_score: null,
    });

    const points = toGraphPoints([holidayLog], "all", TODAY);

    expect(points[0].mood_after_work).toBeNull();
    expect(points[0].overtime_score).toBeNull();
  });
});

describe("useGraph", () => {
  function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  it("should load logs on mount and expose graph points", async () => {
    const api: GraphApi = {
      listLogs: vi.fn().mockResolvedValue([makeLog(daysAgo(1))]),
    };

    const { result } = renderHook(() => useGraph(api));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.points).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it("should set error message when loading logs fails", async () => {
    const api: GraphApi = {
      listLogs: vi.fn().mockRejectedValue(new Error("network error")),
    };

    const { result } = renderHook(() => useGraph(api));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("ログの取得に失敗しました");
  });

  it("should narrow points when period changes from all to 30d", async () => {
    const api: GraphApi = {
      listLogs: vi.fn().mockResolvedValue([makeLog(daysAgo(60)), makeLog(daysAgo(1))]),
    };

    const { result } = renderHook(() => useGraph(api));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPeriod("all"));
    expect(result.current.points).toHaveLength(2);

    act(() => result.current.setPeriod("30d"));
    expect(result.current.points).toHaveLength(1);
  });
});
