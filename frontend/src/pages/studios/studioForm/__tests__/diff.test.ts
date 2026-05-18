import type { StudioFragment } from "src/graphql/types";
import { describe, expect, it } from "vitest";
import selectStudioDetails from "../diff";
import type { StudioFormData } from "../schema";

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

const baseStudio = (overrides: Partial<StudioFragment> = {}): StudioFragment =>
  ({
    id: "studio-1",
    name: "Studio One",
    aliases: ["alt-1"],
    urls: [{ url: "https://a", site: site("1") }],
    images: [image("img-1")],
    parent: { id: "parent-1", name: "Parent" },
    ...overrides,
  }) as unknown as StudioFragment;

const baseForm = (overrides: Partial<StudioFormData> = {}): StudioFormData =>
  ({
    name: "Studio One",
    aliases: ["alt-1"],
    urls: [{ url: "https://a", site: site("1") }],
    images: [image("img-1")],
    parent: { id: "parent-1", name: "Parent" },
    note: "n",
    ...overrides,
  }) as StudioFormData;

describe("selectStudioDetails", () => {
  it("no diff when inputs match", () => {
    const [old, neu] = selectStudioDetails(baseForm(), baseStudio());
    expect(old).toEqual({ name: null, parent: null });
    expect(neu.name).toBeNull();
    expect(neu.parent).toBeNull();
    expect(neu.added_urls).toEqual([]);
    expect(neu.removed_urls).toEqual([]);
    expect(neu.added_aliases).toEqual([]);
    expect(neu.removed_aliases).toEqual([]);
    expect(neu.added_images).toEqual([]);
    expect(neu.removed_images).toEqual([]);
  });

  it("diffs name", () => {
    const [old, neu] = selectStudioDetails(
      baseForm({ name: "Renamed" }),
      baseStudio(),
    );
    expect(old.name).toBe("Studio One");
    expect(neu.name).toBe("Renamed");
  });

  it("diffs parent change", () => {
    const [old, neu] = selectStudioDetails(
      baseForm({ parent: { id: "parent-2", name: "P2" } }),
      baseStudio(),
    );
    expect(old.parent).toEqual({ id: "parent-1", name: "Parent" });
    expect(neu.parent).toEqual({ id: "parent-2", name: "P2" });
  });

  it("diffs parent removal", () => {
    const [old, neu] = selectStudioDetails(
      baseForm({ parent: null }),
      baseStudio(),
    );
    expect(old.parent).toEqual({ id: "parent-1", name: "Parent" });
    expect(neu.parent).toBeNull();
  });

  it("diffs URL add", () => {
    const [, neu] = selectStudioDetails(
      baseForm({
        urls: [
          { url: "https://a", site: site("1") },
          { url: "https://b", site: site("2") },
        ],
      }),
      baseStudio(),
    );
    expect(neu.added_urls).toEqual([{ url: "https://b", site: site("2") }]);
    expect(neu.removed_urls).toEqual([]);
  });

  it("diffs URL remove", () => {
    const [, neu] = selectStudioDetails(baseForm({ urls: [] }), baseStudio());
    expect(neu.added_urls).toEqual([]);
    expect(neu.removed_urls).toEqual([{ url: "https://a", site: site("1") }]);
  });

  it("diffs alias add/remove", () => {
    const [, neu] = selectStudioDetails(
      baseForm({ aliases: ["alt-2"] }),
      baseStudio(),
    );
    expect(neu.added_aliases).toEqual(["alt-2"]);
    expect(neu.removed_aliases).toEqual(["alt-1"]);
  });

  it("diffs image add/remove", () => {
    const [, neu] = selectStudioDetails(
      baseForm({ images: [image("img-2")] }),
      baseStudio(),
    );
    expect(neu.added_images).toEqual([image("img-2")]);
    expect(neu.removed_images).toEqual([image("img-1")]);
  });

  it("handles null original studio (create)", () => {
    const [old, neu] = selectStudioDetails(baseForm(), null);
    expect(old.name).toBeNull();
    expect(neu.name).toBe("Studio One");
    expect(neu.added_aliases).toEqual(["alt-1"]);
  });
});
