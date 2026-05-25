import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePalette } from "../hooks/usePalette";

describe("usePalette", () => {
  it("returns the same color for the same scene id", () => {
    const { result } = renderHook(() => usePalette("seed"));
    const c1 = result.current("scene-a");
    const c2 = result.current("scene-a");
    expect(c1).toBe(c2);
  });

  it("returns different colors for different ids", () => {
    const { result } = renderHook(() => usePalette("seed"));
    expect(result.current("scene-a")).not.toBe(result.current("scene-b"));
  });

  it("seeds the seed scene first (gets the first palette slot)", () => {
    const a = renderHook(() => usePalette("seed-a")).result.current("seed-a");
    const b = renderHook(() => usePalette("seed-b")).result.current("seed-b");
    expect(a).toBe(b);
  });
});
