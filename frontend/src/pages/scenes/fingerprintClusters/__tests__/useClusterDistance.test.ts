import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  SLIDER_MAX,
  SLIDER_MIN,
  snapDistance,
  useClusterDistance,
} from "../hooks/useClusterDistance";

describe("snapDistance", () => {
  it("rounds to the nearest even value", () => {
    expect(snapDistance(3)).toBe(4);
    expect(snapDistance(5)).toBe(6);
  });

  it("clamps to the slider min/max", () => {
    expect(snapDistance(0)).toBe(SLIDER_MIN);
    expect(snapDistance(100)).toBe(SLIDER_MAX);
  });
});

describe("useClusterDistance", () => {
  it("snaps the initial value", () => {
    const { result } = renderHook(() => useClusterDistance(SLIDER_MAX, 7, 10));
    expect(result.current.distance).toBe(8);
  });

  it("debounces the secondary value", async () => {
    const { result } = renderHook(() => useClusterDistance(SLIDER_MAX, 2, 30));

    act(() => result.current.setDistance(8));
    expect(result.current.distance).toBe(8);
    expect(result.current.debouncedDistance).toBe(2);

    await waitFor(() => {
      expect(result.current.debouncedDistance).toBe(8);
    });
  });

  it("snaps setDistance input", () => {
    const { result } = renderHook(() => useClusterDistance(SLIDER_MAX, 2, 10));
    act(() => result.current.setDistance(5));
    expect(result.current.distance).toBe(6);
  });

  it("clamps to the per-instance max", () => {
    const { result } = renderHook(() => useClusterDistance(8, 2, 10));
    act(() => result.current.setDistance(16));
    expect(result.current.distance).toBe(8);
  });
});
