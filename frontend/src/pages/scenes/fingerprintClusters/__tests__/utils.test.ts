import { FingerprintAlgorithm } from "src/graphql";
import { describe, expect, it } from "vitest";
import type { Cluster, ClusterMember } from "../types";
import {
  buildMoveSources,
  clusterSceneSummaries,
  fingerprintSearchHref,
  linkedFingerprintCount,
  memberTotalSubmissions,
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

type LinkedFp =
  ClusterMember["scene_submissions"][number]["linked_fingerprints"][number];

const oshashLink = (hash: string, submissions: number): LinkedFp => ({
  __typename: "ClusterOshash" as const,
  hash,
  submissions,
  reports: 0,
});

const sub = (
  sceneId: string,
  submissions: number,
  linkedFingerprints: LinkedFp[] = [],
) => ({
  __typename: "ClusterSceneSubmission" as const,
  scene: scene(sceneId),
  submissions,
  reports: 0,
  durations: [],
  linked_fingerprints: linkedFingerprints,
});

const member = (
  hash: string,
  scenes: ReturnType<typeof sub>[],
): ClusterMember => ({
  __typename: "ClusterMember" as const,
  hash,
  scene_submissions: scenes,
});

const cluster = (overrides: Partial<Cluster> = {}): Cluster => ({
  __typename: "FingerprintCluster" as const,
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

describe("buildMoveSources", () => {
  it("emits a row per (selected hash, scene) plus its linked oshashes", () => {
    const c = cluster({
      members: [
        member("phashA", [
          sub("s1", 1, [oshashLink("osA", 1)]),
          sub("s2", 1, [oshashLink("osB", 1)]),
        ]),
        member("phashB", [sub("s1", 3)]),
      ],
    });
    const sources = buildMoveSources(c, new Set(["phashA"]));
    expect(sources.get("s1")).toEqual([
      { hash: "phashA", algorithm: phashAlgo },
      { hash: "osA", algorithm: oshashAlgo },
    ]);
    expect(sources.get("s2")).toEqual([
      { hash: "phashA", algorithm: phashAlgo },
      { hash: "osB", algorithm: oshashAlgo },
    ]);
  });

  it("returns empty for missing cluster", () => {
    expect(buildMoveSources(undefined, new Set(["x"])).size).toBe(0);
  });
});

describe("linkedFingerprintCount", () => {
  it("counts linked oshashes for selected hashes only", () => {
    const c = cluster({
      members: [
        member("phashA", [
          sub("s1", 1, [oshashLink("osA", 1)]),
          sub("other", 1, [oshashLink("osZ", 1)]),
        ]),
        member("phashB", [sub("s1", 1, [oshashLink("osB", 1)])]),
      ],
    });
    expect(linkedFingerprintCount(c, new Set(["phashA"]))).toBe(2);
    expect(linkedFingerprintCount(c, new Set(["phashA", "phashB"]))).toBe(3);
  });
});

describe("memberTotalSubmissions", () => {
  it("sums submissions across all scenes", () => {
    expect(
      memberTotalSubmissions(member("a", [sub("s1", 2), sub("s2", 3)])),
    ).toBe(5);
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

  it("returns empty when cluster is undefined", () => {
    expect(multiSceneHashes(undefined)).toEqual([]);
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
    expect(selectedMembers(c, new Set(["a"])).map((m) => m.hash)).toEqual([
      "a",
    ]);
  });

  it("returns empty for missing cluster", () => {
    expect(selectedMembers(undefined, new Set(["a"]))).toEqual([]);
  });
});

describe("clusterSceneSummaries", () => {
  it("aggregates member/submission counts per scene, sorted by submissions desc", () => {
    const c = cluster({
      members: [member("a", [sub("hi", 50)]), member("b", [sub("low", 3)])],
    });
    const out = clusterSceneSummaries(c);
    expect(out.map((x) => x.scene.id)).toEqual(["hi", "low"]);
    expect(out[0].submissionCount).toBe(50);
    expect(out[1].memberCount).toBe(1);
  });

  it("sums member/submission counts across members on the same scene", () => {
    const c = cluster({
      members: [member("a", [sub("s1", 5)]), member("b", [sub("s1", 3)])],
    });
    const out = clusterSceneSummaries(c);
    expect(out).toHaveLength(1);
    expect(out[0].memberCount).toBe(2);
    expect(out[0].submissionCount).toBe(8);
  });
});
