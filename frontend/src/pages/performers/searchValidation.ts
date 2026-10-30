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

export const numericFilterError = (
  value: string | undefined,
  modifier: string | undefined,
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
    number < 0 ||
    number > MAX_FILTER_INTEGER
  )
    return `Enter a whole number between 0 and ${MAX_FILTER_INTEGER}.`;
  return undefined;
};

export const hasInvalidNumericFilters = (values: Record<string, string>) =>
  numericFilterFields.some((name) =>
    numericFilterError(values[name], values[`${name}_modifier`]),
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
