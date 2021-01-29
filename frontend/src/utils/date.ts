import { FuzzyDateInput, DateAccuracyEnum } from "src/definitions/globalTypes";

export const formatFuzzyDate = (date: FuzzyDateInput) => {
  if (date === null) return "";
  if (date.accuracy === DateAccuracyEnum.DAY) return date.date;
  if (date.accuracy === DateAccuracyEnum.MONTH) return date.date.slice(0, 7);
  return date.date.slice(0, 4);
};

export const formatDateTime = (dateTime: Date | string) => {
  const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
  return `${date.toLocaleString("en-us", {
    month: "short",
    year: "numeric",
    day: "numeric",
    timeZone: "UTC",
  })} ${date.toLocaleTimeString(navigator.languages[0], { timeZone: "UTC" })}`;
};
