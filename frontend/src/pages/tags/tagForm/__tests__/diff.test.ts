import type { TagFragment } from "src/graphql/types";
import { describe, expect, it } from "vitest";
import selectTagDetails from "../diff";
import type { TagFormData } from "../schema";

const baseTag = (overrides: Partial<TagFragment> = {}): TagFragment =>
  ({
    id: "tag-1",
    name: "original",
    description: "desc",
    aliases: ["alpha", "beta"],
    category: { id: "cat-1", name: "Activity" },
    ...overrides,
  }) as TagFragment;

const baseForm = (overrides: Partial<TagFormData> = {}): TagFormData => ({
  name: "original",
  description: "desc",
  aliases: ["alpha", "beta"],
  category: { id: "cat-1", name: "Activity" },
  note: "edit note",
  ...overrides,
});

describe("selectTagDetails", () => {
  it("returns nulls/empty arrays when nothing changed", () => {
    const [old, neu] = selectTagDetails(baseForm(), baseTag());
    expect(old).toEqual({ name: null, description: null, category: null });
    expect(neu).toEqual({
      name: null,
      description: null,
      category: null,
      added_aliases: [],
      removed_aliases: [],
    });
  });

  it("diffs name change", () => {
    const [old, neu] = selectTagDetails(
      baseForm({ name: "renamed" }),
      baseTag(),
    );
    expect(old.name).toBe("original");
    expect(neu.name).toBe("renamed");
  });

  it("diffs description change", () => {
    const [old, neu] = selectTagDetails(
      baseForm({ description: "new" }),
      baseTag(),
    );
    expect(old.description).toBe("desc");
    expect(neu.description).toBe("new");
  });

  it("diffs category change", () => {
    const [old, neu] = selectTagDetails(
      baseForm({ category: { id: "cat-2", name: "Other" } }),
      baseTag(),
    );
    expect(old.category).toEqual({ id: "cat-1", name: "Activity" });
    expect(neu.category).toEqual({ id: "cat-2", name: "Other" });
  });

  it("adds and removes aliases", () => {
    const [, neu] = selectTagDetails(
      baseForm({ aliases: ["beta", "gamma"] }),
      baseTag(),
    );
    expect(neu.added_aliases).toEqual(["gamma"]);
    expect(neu.removed_aliases).toEqual(["alpha"]);
  });
});
