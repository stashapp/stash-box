import { FingerprintAlgorithm } from "src/graphql";
import { describe, expect, it } from "vitest";
import type { Cluster, MemberKey } from "../types";
import {
  buildMoveCandidates,
  buildPhashBreakdown,
  dominantDuration,
  expandSelectionToMemberKeys,
  expandWithLinkedOshashes,
  fingerprintSearchHref,
  groupBySource,
  linkedOshashKeysFor,
  multiSceneHashes,
  sceneNameMap,
  sumSelectedSubmissions,
} from "../utils";

const phashAlgo = FingerprintAlgorithm.PHASH;
const oshashAlgo = FingerprintAlgorithm.OSHASH;

const sub = (
  sceneId: string,
  submissions: number,
  durations: number[] = [],
  durationSubmissions: number[] = [],
) => ({
  __typename: "ClusterSceneSubmission" as const,
  scene_id: sceneId,
  submissions,
  reports: 0,
  durations,
  duration_submissions:
    durationSubmissions.length === durations.length
      ? durationSubmissions
      : durations.map(() => submissions),
});

const member = (
  hash: string,
  scenes: ReturnType<typeof sub>[],
  totalSubmissions = scenes.reduce((s, x) => s + x.submissions, 0),
) => ({
  __typename: "ClusterMember" as const,
  hash,
  algorithm: phashAlgo,
  total_submissions: totalSubmissions,
  total_reports: 0,
  scene_submissions: scenes,
});

const cluster = (overrides: Partial<Cluster> = {}): Cluster => ({
  __typename: "FingerprintCluster" as const,
  id: "c1",
  tainted: false,
  members: [],
  edges: [],
  scenes: [],
  linked_oshashes: [],
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

  it("returns empty when cluster is tainted", () => {
    const c = cluster({
      tainted: true,
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

describe("linkedOshashKeysFor / expandWithLinkedOshashes", () => {
  const c = cluster({
    members: [member("phashA", [sub("s1", 1), sub("s2", 1)])],
    linked_oshashes: [
      {
        __typename: "ClusterOshash" as const,
        hash: "osA",
        attached_to: "phashA",
        scene_submissions: [sub("s1", 1)],
      },
      {
        __typename: "ClusterOshash" as const,
        hash: "osB",
        attached_to: "phashA",
        scene_submissions: [sub("s2", 1)],
      },
      {
        __typename: "ClusterOshash" as const,
        hash: "osC",
        attached_to: "other-phash",
        scene_submissions: [sub("s1", 1)],
      },
    ],
  });

  it("returns only oshashes attached to the given phash on the given scene", () => {
    const keys = linkedOshashKeysFor(c, "phashA", "s1");
    expect(keys).toEqual([
      { hash: "osA", algorithm: oshashAlgo, sceneId: "s1" },
    ]);
  });

  it("expandWithLinkedOshashes appends attached oshashes per scene", () => {
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

describe("buildPhashBreakdown", () => {
  it("emits per-scene rows for each selected hash", () => {
    const c = cluster({
      members: [
        member("a", [
          sub("s1", 2, [600], [2]),
          sub("s2", 1, [600, 601], [1, 0]),
        ]),
      ],
    });
    const out = buildPhashBreakdown(c, new Set(["a"]));
    expect(out).toHaveLength(1);
    expect(out[0].perScene[0].durations).toEqual([600]);
    expect(out[0].perScene[1].durationSubmissions).toEqual([1, 0]);
  });
});

describe("sceneNameMap", () => {
  it("maps scene id to title with Untitled fallback", () => {
    const c = cluster({
      scenes: [
        {
          __typename: "ClusterSceneSummary" as const,
          member_count: 1,
          submission_count: 1,
          scene: {
            id: "s1",
            title: "Hello",
            release_date: null,
            deleted: false,
            duration: 1200,
            studio: null,
            images: [],
            performers: [],
            __typename: "Scene" as const,
          },
        },
        {
          __typename: "ClusterSceneSummary" as const,
          member_count: 1,
          submission_count: 1,
          scene: {
            id: "s2",
            title: null,
            release_date: null,
            deleted: false,
            duration: 1200,
            studio: null,
            images: [],
            performers: [],
            __typename: "Scene" as const,
          },
        },
      ],
    });
    const m = sceneNameMap(c);
    expect(m.get("s1")).toBe("Hello");
    expect(m.get("s2")).toBe("Untitled");
  });
});

describe("buildMoveCandidates", () => {
  it("sorts by submission_count desc", () => {
    const sceneSummary = (id: string, submissions: number) => ({
      __typename: "ClusterSceneSummary" as const,
      member_count: 1,
      submission_count: submissions,
      scene: {
        id,
        title: id,
        release_date: null,
        deleted: false,
        duration: 1,
        studio: null,
        images: [],
        performers: [],
        __typename: "Scene" as const,
      },
    });
    const c = cluster({
      scenes: [sceneSummary("low", 3), sceneSummary("hi", 50)],
    });
    const cands = buildMoveCandidates(c);
    expect(cands.map((x) => x.scene.id)).toEqual(["hi", "low"]);
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
