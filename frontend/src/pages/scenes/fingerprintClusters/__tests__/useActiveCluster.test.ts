import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useActiveCluster } from "../hooks/useActiveCluster";
import type { Cluster } from "../types";

const fakeCluster = (hash: string): Cluster =>
  ({
    __typename: "FingerprintCluster",
    members: [
      { __typename: "ClusterMember", hash } as Cluster["members"][number],
    ],
    linked_fingerprints: [],
  }) as Cluster;

describe("useActiveCluster", () => {
  it("auto-selects the first cluster when data arrives", () => {
    const { result, rerender } = renderHook(
      ({ clusters }) => useActiveCluster(clusters),
      { initialProps: { clusters: [] as Cluster[] } },
    );
    expect(result.current.activeCluster).toBeUndefined();

    rerender({ clusters: [fakeCluster("a"), fakeCluster("b")] });
    expect(result.current.activeCluster?.members[0].hash).toBe("a");
  });

  it("resets to the first cluster when the clusters array changes", () => {
    const initial = [fakeCluster("a"), fakeCluster("b")];
    const { result, rerender } = renderHook(
      ({ clusters }) => useActiveCluster(clusters),
      { initialProps: { clusters: initial } },
    );
    act(() => {
      result.current.switchTo(1);
    });
    expect(result.current.activeCluster?.members[0].hash).toBe("b");

    rerender({ clusters: [fakeCluster("c")] });
    expect(result.current.activeCluster?.members[0].hash).toBe("c");
  });

  it("switchTo returns false when the index is already active", () => {
    const { result } = renderHook(() =>
      useActiveCluster([fakeCluster("a"), fakeCluster("b")]),
    );
    let changed: boolean | undefined;
    act(() => {
      changed = result.current.switchTo(0);
    });
    expect(changed).toBe(false);

    act(() => {
      changed = result.current.switchTo(1);
    });
    expect(changed).toBe(true);
  });
});
