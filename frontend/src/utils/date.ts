import { isValid, parseISO } from "date-fns";

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

export const isValidDate = (date?: string) => !date || isValid(parseISO(date));

export const dateWithinRange = (
  date: string | undefined,
  start?: string | Date,
  end?: string | Date,
) => {
  if (!date || (!start && !end)) return true;

  const parsedDate = parseISO(date);
  if (start) {
    const startDate = typeof start === "string" ? parseISO(start) : start;
    if (parsedDate < startDate) return false;
  }

  if (end) {
    const endDate = typeof end === "string" ? parseISO(end) : end;
    if (parsedDate > endDate) return false;
  }

  return true;
};
