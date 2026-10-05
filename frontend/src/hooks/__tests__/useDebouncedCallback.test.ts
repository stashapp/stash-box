import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDebouncedCallback } from "../useDebouncedCallback";

describe("useDebouncedCallback", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("coalesces calls and invokes the latest callback", () => {
    vi.useFakeTimers();
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    const { result, rerender } = renderHook(
      ({ callback }) => useDebouncedCallback(callback, 200),
      { initialProps: { callback: firstCallback } },
    );
    const debouncedCallback = result.current;

    act(() => {
      result.current("first");
      result.current("second");
    });
    rerender({ callback: secondCallback });

    expect(result.current).toBe(debouncedCallback);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledOnce();
    expect(secondCallback).toHaveBeenCalledWith("second");
  });

  it("cancels a pending call when unmounted", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedCallback(callback, 200),
    );

    act(() => {
      result.current();
    });
    unmount();
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
