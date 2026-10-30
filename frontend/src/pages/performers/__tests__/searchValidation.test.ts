import { CriterionModifier } from "src/graphql";
import { describe, expect, it } from "vitest";
import {
  dateFilterError,
  hasInvalidFilters,
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

describe("performer date filters", () => {
  it.each([
    "20081231231",
    "2008-13",
    "2008-02-30",
    "2009-02-29",
    "2008-1-1",
    "20080101",
  ])("rejects invalid date %s", (value) =>
    expect(dateFilterError(value, undefined)).toBeDefined());
  it.each([
    "",
    "2008",
    "2008-12",
    "2008-12-31",
    "2008-02-29",
  ])("accepts valid partial or full date %s", (value) =>
    expect(dateFilterError(value, undefined)).toBeUndefined());
  it.each(["birthdate", "deathdate"])("validates %s", (field) => {
    expect(hasInvalidFilters({ [field]: "20081231231" })).toBe(true);
    expect(hasInvalidFilters({ [field]: "2008" })).toBe(false);
    expect(
      hasInvalidFilters({
        [field]: "bad",
        [`${field}_modifier`]: CriterionModifier.IS_NULL,
      }),
    ).toBe(false);
    expect(
      hasInvalidFilters({
        [field]: "bad",
        [`${field}_modifier`]: CriterionModifier.NOT_NULL,
      }),
    ).toBe(false);
  });
});
