import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  calcOvertime,
  calcOvertimeMinutes,
  calcOvertimeScore,
  useLogForm,
} from "@/hooks/useLogForm";

describe("calcOvertimeMinutes", () => {
  it("should return 0 when work hours equal standard hours", () => {
    expect(calcOvertimeMinutes("09:00", "18:00")).toBe(0);
  });

  it("should return overtime minutes beyond 9 hours", () => {
    expect(calcOvertimeMinutes("09:00", "19:30")).toBe(90);
  });

  it("should clamp to 0 when work hours are less than standard", () => {
    expect(calcOvertimeMinutes("09:00", "17:00")).toBe(0);
  });
});

describe("calcOvertimeScore", () => {
  it.each([
    [0, 0],
    [30, 1],
    [60, 2],
    [90, 3],
    [120, 4],
    [121, 5],
  ])("should return score %i for %i overtime minutes", (minutes, expected) => {
    expect(calcOvertimeScore(minutes)).toBe(expected);
  });
});

describe("calcOvertime", () => {
  it("should return null when work_start is empty", () => {
    expect(calcOvertime("", "18:00")).toBeNull();
  });

  it("should return null when work_end is empty", () => {
    expect(calcOvertime("09:00", "")).toBeNull();
  });

  it("should return overtime preview with minutes and score", () => {
    const result = calcOvertime("09:00", "19:30");
    expect(result).toEqual({ minutes: 90, score: 3 });
  });
});

describe("useLogForm", () => {
  it("should initialize with today's date", () => {
    const today = new Date().toISOString().slice(0, 10);
    const { result } = renderHook(() => useLogForm());
    expect(result.current.fields.date).toBe(today);
  });

  it("should compute overtime preview from work times", () => {
    const { result } = renderHook(() =>
      useLogForm({ work_start: "09:00", work_end: "19:30" })
    );
    expect(result.current.overtimePreview).toEqual({ minutes: 90, score: 3 });
  });

  it("should return null overtime preview when is_holiday is true", () => {
    const { result } = renderHook(() =>
      useLogForm({
        is_holiday: true,
        work_start: "09:00",
        work_end: "19:30",
      })
    );
    expect(result.current.overtimePreview).toBeNull();
  });

  it("should clear work fields when switching to holiday mode", () => {
    const { result } = renderHook(() =>
      useLogForm({
        is_holiday: false,
        work_start: "09:00",
        work_end: "18:00",
        mood_after_work: 2,
        work_content: "設計作業",
      })
    );

    act(() => {
      result.current.setField("is_holiday", true);
    });

    const { fields } = result.current;
    expect(fields.work_start).toBe("");
    expect(fields.work_end).toBe("");
    expect(fields.mood_after_work).toBeNull();
    expect(fields.work_content).toBe("");
  });

  it("should update field value", () => {
    const { result } = renderHook(() => useLogForm());

    act(() => {
      result.current.setField("fatigue", 5);
    });

    expect(result.current.fields.fatigue).toBe(5);
  });
});
