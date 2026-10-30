import { CriterionModifier } from "src/graphql";
import { describe, expect, it } from "vitest";
import {
  hasInvalidNumericFilters,
  numericFilterError,
  numericFilterFields,
} from "../searchValidation";

describe("numeric performer filters", () => {
  it.each([
    "123e12",
    "2147483648",
    "1e999",
    "NaN",
    "abc",
    "1.5",
    "-1",
    " ",
  ])("rejects invalid integer %s", (value) =>
    expect(numericFilterError(value, undefined)).toBeDefined());

  it.each([
    undefined,
    "",
    "0",
    "123",
    "2147483647",
    "1e2",
  ])("accepts valid or empty input %s", (value) =>
    expect(numericFilterError(value, undefined)).toBeUndefined());

  it.each(numericFilterFields)("validates the %s filter", (name) => {
    expect(hasInvalidNumericFilters({ [name]: "123e12" })).toBe(true);
    expect(hasInvalidNumericFilters({ [name]: "123" })).toBe(false);
  });

  it.each([
    CriterionModifier.IS_NULL,
    CriterionModifier.NOT_NULL,
  ])("ignores the unused value for %s", (modifier) => {
    expect(
      hasInvalidNumericFilters({ height: "123e12", height_modifier: modifier }),
    ).toBe(false);
  });
});
