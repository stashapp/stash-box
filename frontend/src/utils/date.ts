import { FuzzyDateInput, DateAccuracyEnum } from "src/graphql";

export const formatFuzzyDate = (date: FuzzyDateInput | null): string => {
  if (date === null) return "";
  if (date.accuracy === DateAccuracyEnum.DAY) return date.date as string;
  if (date.accuracy === DateAccuracyEnum.MONTH)
    return date.date.slice(0, 7) as string;
  return date.date.slice(0, 4) as string;
};

export const formatDateTime = (dateTime: Date | string, utc = false) => {
  const timeZone = utc ? "UTC" : undefined;
  const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
  return `${date.toLocaleString("en-us", {
    month: "short",
    year: "numeric",
    day: "numeric",
    timeZone,
  })} ${date.toLocaleTimeString(navigator.languages[0], {
    timeZone,
  })}`;
};

export const formatFuzzyDateComponents = (
  date?: string | null,
  accuracy?: string | null
) => {
  if (!date) return "";
  if (!accuracy) return date;
  if (accuracy === DateAccuracyEnum.DAY) return date;
  if (accuracy === DateAccuracyEnum.MONTH) return date.slice(0, 7);
  return date.slice(0, 4);
};
