import { GenderEnum, type SceneFragment } from "src/graphql/types";
import { describe, expect, it } from "vitest";
import selectSceneDetails from "../diff";
import type { SceneFormData } from "../schema";

const site = (id: string) => ({
  id,
  name: `site-${id}`,
  icon: `icon-${id}`,
});

const image = (id: string) => ({
  id,
  url: `url-${id}`,
  width: 100,
  height: 100,
});

const baseScene = (overrides: Partial<SceneFragment> = {}): SceneFragment =>
  ({
    id: "s-1",
    title: "Title",
    details: "Details",
    release_date: "2024-01-01",
    production_date: "2023-12-01",
    duration: 3600,
    director: "Director",
    code: "CODE",
    studio: { id: "stu-1", name: "Studio" },
    urls: [{ url: "https://a", site: site("1") }],
    images: [image("img-1")],
    performers: [
      {
        performer: {
          id: "perf-1",
          name: "Jane",
          gender: GenderEnum.FEMALE,
          disambiguation: null,
          deleted: false,
        },
        as: null,
      },
    ],
    tags: [{ id: "t-1", name: "tag1", description: null }],
    ...overrides,
  }) as unknown as SceneFragment;

const baseForm = (overrides: Partial<SceneFormData> = {}): SceneFormData =>
  ({
    title: "Title",
    details: "Details",
    date: "2024-01-01",
    production_date: "2023-12-01",
    duration: "1:00:00",
    director: "Director",
    code: "CODE",
    studio: { id: "stu-1", name: "Studio" },
    urls: [{ url: "https://a", site: site("1") }],
    images: [image("img-1")],
    performers: [
      {
        performerId: "perf-1",
        name: "Jane",
        gender: GenderEnum.FEMALE,
        disambiguation: null,
        alias: null,
        aliases: [],
        deleted: false,
      },
    ],
    tags: [{ id: "t-1", name: "tag1", description: null, aliases: [] }],
    note: "n",
    ...overrides,
  }) as unknown as SceneFormData;

describe("selectSceneDetails", () => {
  it("no diff when unchanged", () => {
    const [old, neu] = selectSceneDetails(baseForm(), baseScene());
    expect(old).toEqual({
      title: null,
      details: null,
      date: null,
      production_date: null,
      duration: null,
      director: null,
      code: null,
      studio: null,
    });
    expect(neu.title).toBeNull();
    expect(neu.added_urls).toEqual([]);
    expect(neu.removed_urls).toEqual([]);
    expect(neu.added_performers).toEqual([]);
    expect(neu.removed_performers).toEqual([]);
    expect(neu.added_tags).toEqual([]);
    expect(neu.removed_tags).toEqual([]);
    expect(neu.added_images).toEqual([]);
    expect(neu.removed_images).toEqual([]);
  });

  it.each([
    ["title", "Title", "New Title"],
    ["details", "Details", "New Details"],
    ["director", "Director", "New Director"],
    ["code", "CODE", "NEW"],
  ] as const)("diffs scalar field %s", (k, oldVal, newVal) => {
    const [old, neu] = selectSceneDetails(
      baseForm({ [k]: newVal } as Partial<SceneFormData>),
      baseScene(),
    );
    expect((old as unknown as Record<string, unknown>)[k]).toBe(oldVal);
    expect((neu as unknown as Record<string, unknown>)[k]).toBe(newVal);
  });

  it("diffs release date", () => {
    const [old, neu] = selectSceneDetails(
      baseForm({ date: "2025-05-05" }),
      baseScene(),
    );
    expect(old.date).toBe("2024-01-01");
    expect(neu.date).toBe("2025-05-05");
  });

  it("diffs production date", () => {
    const [old, neu] = selectSceneDetails(
      baseForm({ production_date: "2022-01-01" }),
      baseScene(),
    );
    expect(old.production_date).toBe("2023-12-01");
    expect(neu.production_date).toBe("2022-01-01");
  });

  it("diffs duration via parseDuration", () => {
    const [old, neu] = selectSceneDetails(
      baseForm({ duration: "2:00:00" }),
      baseScene(),
    );
    expect(old.duration).toBe(3600);
    expect(neu.duration).toBe(7200);
  });

  it("diffs studio change", () => {
    const [old, neu] = selectSceneDetails(
      baseForm({ studio: { id: "stu-2", name: "Other" } }),
      baseScene(),
    );
    expect(old.studio).toEqual({ id: "stu-1", name: "Studio" });
    expect(neu.studio).toEqual({ id: "stu-2", name: "Other" });
  });

  it("diffs performer add/remove", () => {
    const [, neu] = selectSceneDetails(
      baseForm({
        performers: [
          {
            performerId: "perf-2",
            name: "Bob",
            gender: GenderEnum.MALE,
            disambiguation: null,
            alias: null,
            aliases: [],
            deleted: false,
          },
        ],
      }),
      baseScene(),
    );
    expect(neu.added_performers).toEqual([
      {
        performer: {
          id: "perf-2",
          name: "Bob",
          gender: GenderEnum.MALE,
          disambiguation: null,
          deleted: false,
        },
        as: null,
      },
    ]);
    expect(neu.removed_performers).toHaveLength(1);
    // biome-ignore lint/style/noNonNullAssertion: known non-null in test
    expect(neu.removed_performers![0].performer.id).toBe("perf-1");
  });

  it("diffs tag add/remove", () => {
    const [, neu] = selectSceneDetails(
      baseForm({
        tags: [{ id: "t-2", name: "tag2", description: null, aliases: [] }],
      }),
      baseScene(),
    );
    expect(neu.added_tags).toEqual([
      { id: "t-2", name: "tag2", description: null },
    ]);
    expect(neu.removed_tags).toHaveLength(1);
    // biome-ignore lint/style/noNonNullAssertion: known non-null in test
    expect(neu.removed_tags![0].id).toBe("t-1");
  });

  it("diffs url add/remove", () => {
    const [, neu] = selectSceneDetails(
      baseForm({
        urls: [
          { url: "https://a", site: site("1") },
          { url: "https://b", site: site("2") },
        ],
      }),
      baseScene(),
    );
    expect(neu.added_urls).toEqual([{ url: "https://b", site: site("2") }]);
  });

  it("diffs image add/remove", () => {
    const [, neu] = selectSceneDetails(
      baseForm({ images: [image("img-2")] }),
      baseScene(),
    );
    expect(neu.added_images).toEqual([image("img-2")]);
    expect(neu.removed_images).toEqual([image("img-1")]);
  });

  it("handles null original (create flow)", () => {
    const [old, neu] = selectSceneDetails(baseForm(), null);
    expect(old.title).toBeNull();
    expect(neu.title).toBe("Title");
    expect(neu.added_performers).toHaveLength(1);
  });
});
