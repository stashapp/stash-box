import type { SceneFragment } from "src/graphql/types";
import { describe, expect, it } from "vitest";
import { buildSceneMerge } from "../merge";

const scene = (
  id: string,
  overrides: Record<string, unknown> = {},
): SceneFragment =>
  ({
    id,
    release_date: null,
    production_date: null,
    title: `title-${id}`,
    deleted: false,
    details: null,
    director: null,
    code: null,
    duration: null,
    urls: [],
    images: [],
    studio: null,
    performers: [],
    tags: [],
    ...overrides,
  }) as unknown as SceneFragment;

describe("buildSceneMerge", () => {
  it("fills empty target fields from the first source with a value", () => {
    const target = scene("target");
    const source = scene("source", {
      details: "source details",
      director: "source director",
      release_date: "2020-01-01",
    });

    const { initial } = buildSceneMerge(target, [source]);

    expect(initial.details).toBe("source details");
    expect(initial.director).toBe("source director");
    expect(initial.date).toBe("2020-01-01");
  });

  it("prefers the target value when it is set", () => {
    const target = scene("target", { details: "target details" });
    const source = scene("source", { details: "source details" });

    const { initial } = buildSceneMerge(target, [source]);

    expect(initial.details).toBe("target details");
  });

  it("combines multi-value fields, deduplicating by id", () => {
    const target = scene("target", {
      tags: [{ id: "t1", name: "A", aliases: [] }],
      images: [{ id: "i1", url: "u1", width: 1, height: 1 }],
    });
    const source = scene("source", {
      tags: [
        { id: "t1", name: "A", aliases: [] },
        { id: "t2", name: "B", aliases: [] },
      ],
      images: [{ id: "i2", url: "u2", width: 1, height: 1 }],
    });

    const { initial } = buildSceneMerge(target, [source]);

    expect(initial.tags?.map((tag) => tag.id)).toEqual(["t1", "t2"]);
    expect(initial.images?.map((image) => image.id)).toEqual(["i1", "i2"]);
  });

  it("reports a conflict when single-value fields differ", () => {
    const target = scene("target", { director: "one" });
    const source = scene("source", { director: "two" });

    const { conflicts } = buildSceneMerge(target, [source]);

    const conflict = conflicts.find((c) => c.field === "director");
    expect(conflict?.options.map((o) => o.value)).toEqual(["one", "two"]);
    expect(conflict?.options[0].sources).toEqual(["title-target"]);
  });

  it("reports a studio conflict keyed by id", () => {
    const target = scene("target", { studio: { id: "s1", name: "Studio A" } });
    const source = scene("source", { studio: { id: "s2", name: "Studio B" } });

    const { conflicts } = buildSceneMerge(target, [source]);

    const conflict = conflicts.find((c) => c.field === "studio");
    expect(conflict?.options.map((o) => o.display)).toEqual([
      "Studio A",
      "Studio B",
    ]);
    expect(conflict?.options[1].value).toEqual({ id: "s2", name: "Studio B" });
    expect(conflict?.currentKey({ id: "s2", name: "Studio B" })).toBe("s2");
  });

  it("reports a duration conflict with formatted values", () => {
    const target = scene("target", { duration: 60 });
    const source = scene("source", { duration: 120 });

    const { conflicts } = buildSceneMerge(target, [source]);

    const conflict = conflicts.find((c) => c.field === "duration");
    expect(conflict?.options.map((o) => o.value)).toEqual(["01:00", "02:00"]);
  });

  it("does not report conflicts when values match or are unset", () => {
    const target = scene("target", {
      title: "same",
      director: "same",
      duration: 60,
    });
    const source = scene("source", {
      title: "same",
      director: "same",
      duration: 60,
    });

    const { conflicts } = buildSceneMerge(target, [source]);

    expect(conflicts).toHaveLength(0);
  });
});
