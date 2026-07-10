import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useDuplicateDateGuard,
  DuplicateGuardApi,
} from "@/hooks/useDuplicateDateGuard";

const EXISTING = [
  { id: "log-1", date: "2026-07-01" },
  { id: "log-2", date: "2026-07-02" },
];

describe("useDuplicateDateGuard", () => {
  it("should return existing log id when date matches", async () => {
    const api: DuplicateGuardApi = {
      listLogs: vi.fn().mockResolvedValue(EXISTING),
    };

    const { result } = renderHook(() =>
      useDuplicateDateGuard("2026-07-02", true, api)
    );

    await waitFor(() => expect(result.current).toBe("log-2"));
  });

  it("should return null when no log matches the date", async () => {
    const api: DuplicateGuardApi = {
      listLogs: vi.fn().mockResolvedValue(EXISTING),
    };

    const { result } = renderHook(() =>
      useDuplicateDateGuard("2026-07-03", true, api)
    );

    await waitFor(() => expect(api.listLogs).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  it("should not fetch logs when disabled", () => {
    const api: DuplicateGuardApi = {
      listLogs: vi.fn().mockResolvedValue(EXISTING),
    };

    const { result } = renderHook(() =>
      useDuplicateDateGuard("2026-07-01", false, api)
    );

    expect(api.listLogs).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("should return null when fetching logs fails", async () => {
    const api: DuplicateGuardApi = {
      listLogs: vi.fn().mockRejectedValue(new Error("network error")),
    };

    const { result } = renderHook(() =>
      useDuplicateDateGuard("2026-07-01", true, api)
    );

    await waitFor(() => expect(api.listLogs).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });
});
