import { describe, it, expect } from "vitest";
import { analysisPeriodParams } from "@/lib/reports";

const TODAY = "2026-07-17";
const CUSTOM = { startDate: "2026-05-01", endDate: "2026-05-31" };

describe("analysisPeriodParams", () => {
  it("should return the last 7 days including today for 7d", () => {
    expect(analysisPeriodParams("7d", TODAY, CUSTOM)).toEqual({
      startDate: "2026-07-11",
      endDate: TODAY,
    });
  });

  it("should return the last 30 days including today for 30d", () => {
    expect(analysisPeriodParams("30d", TODAY, CUSTOM)).toEqual({
      startDate: "2026-06-18",
      endDate: TODAY,
    });
  });

  it("should return the last 90 days including today for 90d", () => {
    expect(analysisPeriodParams("90d", TODAY, CUSTOM)).toEqual({
      startDate: "2026-04-19",
      endDate: TODAY,
    });
  });

  it("should return the custom range as is for custom", () => {
    expect(analysisPeriodParams("custom", TODAY, CUSTOM)).toEqual(CUSTOM);
  });
});
