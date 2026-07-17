import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useDuplicateDateGuard,
  DuplicateGuardApi,
} from "@/hooks/useDuplicateDateGuard";
import { swrWrapper } from "./helpers/swr";

describe("useDuplicateDateGuard", () => {
  it("should return existing log id when a log exists on the date", async () => {
    const api: DuplicateGuardApi = {
      listLogs: vi.fn().mockResolvedValue([{ id: "log-2", date: "2026-07-02" }]),
    };

    const { result } = renderHook(
      () => useDuplicateDateGuard("2026-07-02", true, api),
      { wrapper: swrWrapper }
    );

    await waitFor(() => expect(result.current).toBe("log-2"));
    expect(api.listLogs).toHaveBeenCalledWith({
      startDate: "2026-07-02",
      endDate: "2026-07-02",
    });
  });

  it("should return null when no log exists on the date", async () => {
    const api: DuplicateGuardApi = {
      listLogs: vi.fn().mockResolvedValue([]),
    };

    const { result } = renderHook(
      () => useDuplicateDateGuard("2026-07-03", true, api),
      { wrapper: swrWrapper }
    );

    await waitFor(() => expect(api.listLogs).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  it("should not fetch logs when disabled", () => {
    const api: DuplicateGuardApi = {
      listLogs: vi.fn().mockResolvedValue([]),
    };

    const { result } = renderHook(
      () => useDuplicateDateGuard("2026-07-01", false, api),
      { wrapper: swrWrapper }
    );

    expect(api.listLogs).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("should return null when fetching logs fails", async () => {
    const api: DuplicateGuardApi = {
      listLogs: vi.fn().mockRejectedValue(new Error("network error")),
    };

    const { result } = renderHook(
      () => useDuplicateDateGuard("2026-07-01", true, api),
      { wrapper: swrWrapper }
    );

    await waitFor(() => expect(api.listLogs).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });
});
