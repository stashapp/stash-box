import { describe, expect, it } from "vitest";
import { buildTagMerge } from "../merge";

type Tag = Parameters<typeof buildTagMerge>[0];

const tag = (name: string, overrides: Partial<Tag> = {}): Tag => ({
  name,
  description: null,
  aliases: [],
  category: null,
  ...overrides,
});

describe("buildTagMerge", () => {
  it("fills empty target fields from the first source with a value", () => {
    const target = tag("Target");
    const source = tag("Source", {
      description: "from source",
      category: { id: "c1", name: "Action" },
    });

    const { initial } = buildTagMerge(target, [source]);

    expect(initial.description).toBe("from source");
    expect(initial.category).toEqual({ id: "c1", name: "Action" });
  });

  it("prefers the target value when it is set", () => {
    const target = tag("Target", { description: "target desc" });
    const source = tag("Source", { description: "source desc" });

    const { initial } = buildTagMerge(target, [source]);

    expect(initial.description).toBe("target desc");
  });

  it("combines source names and aliases into the alias list", () => {
    const target = tag("Target", { aliases: ["T"] });
    const source = tag("Source", { aliases: ["S", "T"] });

    const { initial } = buildTagMerge(target, [source]);

    expect(initial.aliases).toEqual(["T", "Source", "S"]);
  });

  it("reports a conflict when descriptions differ", () => {
    const target = tag("Target", { description: "one" });
    const source = tag("Source", { description: "two" });

    const { conflicts } = buildTagMerge(target, [source]);

    const conflict = conflicts.find((c) => c.field === "description");
    expect(conflict?.options.map((o) => o.value)).toEqual(["one", "two"]);
    expect(conflict?.options[0].sources).toEqual(["Target"]);
  });

  it("reports a conflict when categories differ, keyed by id", () => {
    const target = tag("Target", { category: { id: "c1", name: "Action" } });
    const source = tag("Source", { category: { id: "c2", name: "Genre" } });

    const { conflicts } = buildTagMerge(target, [source]);

    const conflict = conflicts.find((c) => c.field === "category");
    expect(conflict?.options.map((o) => o.display)).toEqual([
      "Action",
      "Genre",
    ]);
    expect(conflict?.options[1].value).toEqual({ id: "c2", name: "Genre" });
    expect(conflict?.currentKey({ id: "c2", name: "Genre" })).toBe("c2");
  });

  it("does not report conflicts when values match or are unset", () => {
    const target = tag("Target", {
      description: "same",
      category: { id: "c1", name: "Action" },
    });
    const source = tag("Source", {
      description: "same",
      category: { id: "c1", name: "Action" },
    });

    const { conflicts } = buildTagMerge(target, [source]);

    expect(conflicts).toHaveLength(0);
  });
});
