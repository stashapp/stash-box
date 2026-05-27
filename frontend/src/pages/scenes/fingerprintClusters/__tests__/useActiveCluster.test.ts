import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useActiveCluster } from "../hooks/useActiveCluster";
import type { Cluster } from "../types";

const fakeCluster = (id: string): Cluster =>
  ({
    __typename: "FingerprintCluster",
    id,
    poisoned: false,
    members: [],
    edges: [],
    scenes: [],
    linked_oshashes: [],
  }) as Cluster;

describe("useActiveCluster", () => {
  it("auto-selects the first cluster when data arrives", () => {
    const { result, rerender } = renderHook(
      ({ clusters }) => useActiveCluster(clusters),
      { initialProps: { clusters: [] as Cluster[] } },
    );
    expect(result.current.activeCluster).toBeUndefined();

    rerender({ clusters: [fakeCluster("a"), fakeCluster("b")] });
    expect(result.current.activeCluster?.id).toBe("a");
  });

  it("falls back to first when the active cluster disappears", () => {
    const { result, rerender } = renderHook(
      ({ clusters }) => useActiveCluster(clusters),
      { initialProps: { clusters: [fakeCluster("a"), fakeCluster("b")] } },
    );
    act(() => {
      result.current.switchTo("b");
    });
    expect(result.current.activeCluster?.id).toBe("b");

    rerender({ clusters: [fakeCluster("a")] });
    expect(result.current.activeCluster?.id).toBe("a");
  });

  it("switchTo returns false when the id is already active", () => {
    const { result } = renderHook(() =>
      useActiveCluster([fakeCluster("a"), fakeCluster("b")]),
    );
    // After mount, "a" is active.
    let changed: boolean | undefined;
    act(() => {
      changed = result.current.switchTo("a");
    });
    expect(changed).toBe(false);

    act(() => {
      changed = result.current.switchTo("b");
    });
    expect(changed).toBe(true);
  });
});
