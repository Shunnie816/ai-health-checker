import { describe, it, expect } from "vitest";
import { addDaysString } from "@/lib/format";

describe("addDaysString", () => {
  it("should add days within the same month", () => {
    expect(addDaysString("2026-07-10", 5)).toBe("2026-07-15");
  });

  it("should subtract days across a month boundary", () => {
    expect(addDaysString("2026-07-02", -14)).toBe("2026-06-18");
  });

  it("should subtract days across a year boundary", () => {
    expect(addDaysString("2026-01-01", -1)).toBe("2025-12-31");
  });
});
