import { CriterionModifier } from "src/graphql";
import { describe, expect, it } from "vitest";
import { buildTagCriterion, parseTagFilterMode } from "../criterion";

describe("buildTagCriterion", () => {
  it("returns undefined when no tags are selected", () => {
    expect(buildTagCriterion([], "exclude")).toBeUndefined();
  });

  it("maps each mode to its criterion modifier", () => {
    const ids = ["a", "b"];
    expect(buildTagCriterion(ids, "all")).toEqual({
      value: ids,
      modifier: CriterionModifier.INCLUDES_ALL,
    });
    expect(buildTagCriterion(ids, "any")).toEqual({
      value: ids,
      modifier: CriterionModifier.INCLUDES,
    });
    expect(buildTagCriterion(ids, "exclude")).toEqual({
      value: ids,
      modifier: CriterionModifier.EXCLUDES,
    });
  });
});

describe("parseTagFilterMode", () => {
  it("accepts known modes", () => {
    expect(parseTagFilterMode("any")).toBe("any");
    expect(parseTagFilterMode("exclude")).toBe("exclude");
  });

  it("falls back to all for missing or unknown values", () => {
    expect(parseTagFilterMode(undefined)).toBe("all");
    expect(parseTagFilterMode("bogus")).toBe("all");
  });
});
