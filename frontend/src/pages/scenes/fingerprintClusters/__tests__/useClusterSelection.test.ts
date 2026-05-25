import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useClusterSelection } from "../useClusterSelection";

describe("useClusterSelection", () => {
  it("toggles a hash on then off", () => {
    const { result } = renderHook(() => useClusterSelection());

    act(() => result.current.toggle("a"));
    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.selectedHashes.has("a")).toBe(true);

    act(() => result.current.toggle("a"));
    expect(result.current.isSelected("a")).toBe(false);
  });

  it("setMany flips multiple at once", () => {
    const { result } = renderHook(() => useClusterSelection());

    act(() => result.current.setMany(["a", "b", "c"], true));
    expect(result.current.selectedHashes.size).toBe(3);

    act(() => result.current.setMany(["a", "c"], false));
    expect(result.current.selectedHashes.has("a")).toBe(false);
    expect(result.current.selectedHashes.has("b")).toBe(true);
    expect(result.current.selectedHashes.has("c")).toBe(false);
  });

  it("clear empties the selection", () => {
    const { result } = renderHook(() => useClusterSelection());

    act(() => result.current.setMany(["a", "b"], true));
    act(() => result.current.clear());
    expect(result.current.selectedHashes.size).toBe(0);
  });
});
