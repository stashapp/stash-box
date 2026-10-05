import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useExpandedRows } from "../hooks/useExpandedRows";

describe("useExpandedRows", () => {
  it("toggles a row open and closed", () => {
    const { result } = renderHook(() => useExpandedRows());
    expect(result.current.expanded.has("k")).toBe(false);

    act(() => result.current.toggle("k"));
    expect(result.current.expanded.has("k")).toBe(true);

    act(() => result.current.toggle("k"));
    expect(result.current.expanded.has("k")).toBe(false);
  });

  it("tracks multiple keys independently", () => {
    const { result } = renderHook(() => useExpandedRows());
    act(() => result.current.toggle("a"));
    act(() => result.current.toggle("b"));
    expect(result.current.expanded.has("a")).toBe(true);
    expect(result.current.expanded.has("b")).toBe(true);
  });
});
