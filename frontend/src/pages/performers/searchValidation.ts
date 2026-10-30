import { CriterionModifier } from "src/graphql";
import { isValidDate, PARTIAL_DATE } from "src/utils/date";

export const MAX_FILTER_INTEGER = 2147483647;
export const numericFilterFields = [
  "age",
  "band_size",
  "waist_size",
  "hip_size",
  "height",
  "career_start_year",
  "career_end_year",
] as const;

export const numericFilterMin = (name: string) => (name === "age" ? 18 : 0);

export const numericFilterMax = (name: string) =>
  name === "age" ? 100 : MAX_FILTER_INTEGER;

export const numericFilterError = (
  value: string | undefined,
  modifier: string | undefined,
  minimum = 0,
  maximum = MAX_FILTER_INTEGER,
): string | undefined => {
  if (
    !value ||
    modifier === CriterionModifier.IS_NULL ||
    modifier === CriterionModifier.NOT_NULL
  )
    return undefined;

  const number = Number(value);
  if (
    !value.trim() ||
    !Number.isInteger(number) ||
    number < minimum ||
    number > maximum
  )
    return `Enter a whole number between ${minimum} and ${maximum}.`;
  return undefined;
};

export const hasInvalidNumericFilters = (values: Record<string, string>) =>
  numericFilterFields.some((name) =>
    numericFilterError(
      values[name],
      values[`${name}_modifier`],
      numericFilterMin(name),
      numericFilterMax(name),
    ),
  );

export const dateFilterError = (
  value: string | undefined,
  modifier: string | undefined,
): string | undefined => {
  if (
    !value ||
    modifier === CriterionModifier.IS_NULL ||
    modifier === CriterionModifier.NOT_NULL
  )
    return undefined;
  if (!PARTIAL_DATE.test(value))
    return "Enter a date as YYYY, YYYY-MM, or YYYY-MM-DD.";
  if (!isValidDate(value)) return "Enter a valid date.";
  return undefined;
};

export const hasInvalidFilters = (values: Record<string, string>) =>
  hasInvalidNumericFilters(values) ||
  ["birthdate", "deathdate"].some((name) =>
    dateFilterError(values[name], values[`${name}_modifier`]),
  );
