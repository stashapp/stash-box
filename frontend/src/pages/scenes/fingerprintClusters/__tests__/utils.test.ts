import { FingerprintAlgorithm } from "src/graphql";
import { describe, expect, it } from "vitest";
import type { Cluster, ClusterMember, MemberKey } from "../types";
import {
  clusterSceneSummaries,
  dominantDuration,
  expandSelectionToMemberKeys,
  expandWithLinkedOshashes,
  fingerprintSearchHref,
  groupBySource,
  memberDurationCounts,
  multiSceneHashes,
  selectedMembers,
  sumSelectedSubmissions,
} from "../utils";

const phashAlgo = FingerprintAlgorithm.PHASH;
const oshashAlgo = FingerprintAlgorithm.OSHASH;

const scene = (id: string, title: string | null = id) => ({
  __typename: "Scene" as const,
  id,
  title,
  release_date: null,
  deleted: false,
  duration: null,
  studio: null,
  performers: [],
});

const sub = (
  sceneId: string,
  submissions: number,
  durations: number[] = [],
  durationSubmissions: number[] = [],
) => ({
  __typename: "ClusterSceneSubmission" as const,
  scene: scene(sceneId),
  submissions,
  reports: 0,
  durations: durations.map((d, i) => ({
    __typename: "DurationCount" as const,
    duration: d,
    count:
      durationSubmissions.length === durations.length
        ? durationSubmissions[i]
        : submissions,
  })),
});

const oshashLink = (
  hash: string,
  sceneId: string,
  submissions: number,
): ClusterMember["linked_oshashes"][number] => ({
  __typename: "ClusterOshash" as const,
  hash,
  scene: { __typename: "Scene" as const, id: sceneId, title: sceneId },
  submissions,
  reports: 0,
});

const member = (
  hash: string,
  scenes: ReturnType<typeof sub>[],
  linkedOshashes: ClusterMember["linked_oshashes"] = [],
): ClusterMember => ({
  __typename: "ClusterMember" as const,
  hash,
  scene_submissions: scenes,
  linked_oshashes: linkedOshashes,
});

const cluster = (overrides: Partial<Cluster> = {}): Cluster => ({
  __typename: "FingerprintCluster" as const,
  id: "c1",
  poisoned: false,
  members: [],
  ...overrides,
});

describe("fingerprintSearchHref", () => {
  it("encodes the hash into the scenes URL", () => {
    expect(fingerprintSearchHref("abc 123")).toBe(
      "/scenes?fingerprint=abc%20123",
    );
  });
});

describe("groupBySource", () => {
  it("buckets keys by sceneId", () => {
    const keys: MemberKey[] = [
      { hash: "a", algorithm: phashAlgo, sceneId: "s1" },
      { hash: "b", algorithm: phashAlgo, sceneId: "s1" },
      { hash: "c", algorithm: oshashAlgo, sceneId: "s2" },
    ];
    const groups = groupBySource(keys);
    expect(groups.size).toBe(2);
    expect(groups.get("s1")).toHaveLength(2);
    expect(groups.get("s2")).toEqual([{ hash: "c", algorithm: oshashAlgo }]);
  });
});

describe("multiSceneHashes", () => {
  it("returns only hashes present on >1 scene", () => {
    const c = cluster({
      members: [
        member("only-on-s1", [sub("s1", 5)]),
        member("on-s1-and-s2", [sub("s1", 3), sub("s2", 2)]),
      ],
    });
    expect(multiSceneHashes(c)).toEqual(["on-s1-and-s2"]);
  });

  it("returns empty when cluster is poisoned", () => {
    const c = cluster({
      poisoned: true,
      members: [member("h", [sub("s1", 1), sub("s2", 1)])],
    });
    expect(multiSceneHashes(c)).toEqual([]);
  });

  it("returns empty when cluster is undefined", () => {
    expect(multiSceneHashes(undefined)).toEqual([]);
  });
});

describe("expandSelectionToMemberKeys", () => {
  it("emits one MemberKey per (hash, scene) for selected hashes", () => {
    const c = cluster({
      members: [
        member("a", [sub("s1", 1), sub("s2", 2)]),
        member("b", [sub("s1", 3)]),
      ],
    });
    const keys = expandSelectionToMemberKeys(c, new Set(["a"]));
    expect(keys).toEqual([
      { hash: "a", algorithm: phashAlgo, sceneId: "s1" },
      { hash: "a", algorithm: phashAlgo, sceneId: "s2" },
    ]);
  });

  it("returns empty for missing cluster", () => {
    expect(expandSelectionToMemberKeys(undefined, new Set(["a"]))).toEqual([]);
  });
});

describe("expandWithLinkedOshashes", () => {
  const c = cluster({
    members: [
      member(
        "phashA",
        [sub("s1", 1), sub("s2", 1)],
        [oshashLink("osA", "s1", 1), oshashLink("osB", "s2", 1)],
      ),
    ],
  });

  it("appends attached oshashes per scene", () => {
    const expanded = expandWithLinkedOshashes(c, [
      { hash: "phashA", algorithm: phashAlgo, sceneId: "s1" },
      { hash: "phashA", algorithm: phashAlgo, sceneId: "s2" },
    ]);
    expect(expanded).toHaveLength(4);
    expect(expanded).toContainEqual({
      hash: "osA",
      algorithm: oshashAlgo,
      sceneId: "s1",
    });
    expect(expanded).toContainEqual({
      hash: "osB",
      algorithm: oshashAlgo,
      sceneId: "s2",
    });
  });

  it("dedupes if the same (hash, scene) keeps appearing", () => {
    const expanded = expandWithLinkedOshashes(c, [
      { hash: "phashA", algorithm: phashAlgo, sceneId: "s1" },
      { hash: "phashA", algorithm: phashAlgo, sceneId: "s1" },
    ]);
    expect(expanded.filter((k) => k.hash === "osA")).toHaveLength(1);
  });
});

describe("sumSelectedSubmissions", () => {
  it("sums per-scene submission counts for selected hashes", () => {
    const c = cluster({
      members: [
        member("a", [sub("s1", 2), sub("s2", 3)]),
        member("b", [sub("s1", 5)]),
      ],
    });
    expect(sumSelectedSubmissions(c, new Set(["a"]))).toBe(5);
    expect(sumSelectedSubmissions(c, new Set(["a", "b"]))).toBe(10);
  });
});

describe("selectedMembers", () => {
  it("returns only members whose hash is in the selection set", () => {
    const c = cluster({
      members: [member("a", [sub("s1", 2)]), member("b", [sub("s1", 5)])],
    });
    const out = selectedMembers(c, new Set(["a"]));
    expect(out.map((m) => m.hash)).toEqual(["a"]);
  });

  it("returns empty for missing cluster", () => {
    expect(selectedMembers(undefined, new Set(["a"]))).toEqual([]);
  });
});

describe("memberDurationCounts", () => {
  it("sums duration_submissions across scenes, sorted ascending", () => {
    const m = member("a", [
      sub("s1", 2, [600], [2]),
      sub("s2", 3, [601, 600], [1, 2]),
    ]);
    expect(memberDurationCounts(m)).toEqual([
      [600, 4],
      [601, 1],
    ]);
  });
});

describe("clusterSceneSummaries", () => {
  it("aggregates member/submission counts per scene, sorted by submissions desc", () => {
    const c = cluster({
      members: [
        member("a", [sub("hi", 50)]),
        member("b", [sub("low", 3)]),
      ],
    });
    const out = clusterSceneSummaries(c);
    expect(out.map((x) => x.scene.id)).toEqual(["hi", "low"]);
    expect(out[0].submissionCount).toBe(50);
    expect(out[1].memberCount).toBe(1);
  });

  it("counts each member once per scene even with multiple submissions", () => {
    const c = cluster({
      members: [member("a", [sub("s1", 5)]), member("b", [sub("s1", 3)])],
    });
    const out = clusterSceneSummaries(c);
    expect(out).toHaveLength(1);
    expect(out[0].memberCount).toBe(2);
    expect(out[0].submissionCount).toBe(8);
  });
});

describe("dominantDuration", () => {
  it("returns the most-submitted duration across scenes", () => {
    const m = member("a", [sub("s1", 5, [600], [5]), sub("s2", 1, [601], [1])]);
    expect(dominantDuration(m)).toBe(600);
  });

  it("returns null for member with no submissions", () => {
    expect(dominantDuration(member("a", []))).toBe(null);
  });
});
