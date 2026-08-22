import { Temporal } from "temporal-polyfill";

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

export const formatDate = (dateTime: Date | string, utc = false) => {
  const timeZone = utc ? "UTC" : undefined;
  const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
  return date.toLocaleString("en-us", {
    month: "short",
    year: "numeric",
    day: "numeric",
    timeZone,
  });
};

export const formatISODate = (dateTime: Date | string) => {
  const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
  return date.toISOString().slice(0, 10);
};

const MIN_DATE = Temporal.PlainDate.from("1900-01-01");
export const maxBirthdate = () =>
  Temporal.Now.plainDateISO().add({ years: -18 });
export const maxDeathdate = () => Temporal.Now.plainDateISO();
export const maxReleaseDate = () =>
  Temporal.Now.plainDateISO().add({ years: 1 });
// Today, unlike a release date: a scene can be announced before it exists but an image cannot be from the future
export const maxImageDate = () => Temporal.Now.plainDateISO();

export const isInstantInFuture = (instant: Temporal.Instant) =>
  Temporal.Instant.compare(instant, Temporal.Now.instant()) > 0;

export const formatInstant = (instant: Temporal.Instant) =>
  instant.toZonedDateTimeISO(Temporal.Now.timeZoneId()).toLocaleString();

/** The three precisions a partial date may be written to. */
export const PARTIAL_DATE = /^\d{4}$|^\d{4}-\d{2}$|^\d{4}-\d{2}-\d{2}$/;

const expandPartialDate = (date: string) => {
  if (/^\d{4}$/.test(date)) return `${date}-01-01`;
  if (/^\d{4}-\d{2}$/.test(date)) return `${date}-01`;
  return date;
};

export const isValidDate = (date?: string) => {
  if (!date) return true;
  try {
    Temporal.PlainDate.from(expandPartialDate(date));
    return true;
  } catch {
    return false;
  }
};

export const isDateInRange = (
  date: string | undefined,
  end?: Temporal.PlainDate,
) => {
  if (!date) return true;

  let parsedDate: Temporal.PlainDate;
  try {
    parsedDate = Temporal.PlainDate.from(expandPartialDate(date));
  } catch {
    return true;
  }

  if (Temporal.PlainDate.compare(parsedDate, MIN_DATE) < 0) return false;

  if (end && Temporal.PlainDate.compare(parsedDate, end) > 0) return false;

  return true;
};

export const partialDateError = (
  date: string | null | undefined,
  end: Temporal.PlainDate,
): string | undefined => {
  if (!date) return undefined;
  if (!PARTIAL_DATE.test(date))
    return "Invalid date, must be YYYY, YYYY-MM, or YYYY-MM-DD";
  if (!isValidDate(date)) return "Invalid date";
  if (!isDateInRange(date, end)) return "Outside of range";
  return undefined;
};

export const formatDistance = (
  from: Temporal.Instant,
  to?: Temporal.Instant,
) => {
  const toInstant = to ?? Temporal.Now.instant();
  const tz = Temporal.Now.timeZoneId();
  const fromZDT = from.toZonedDateTimeISO(tz);
  const toZDT = toInstant.toZonedDateTimeISO(tz);

  const rough = fromZDT.since(toZDT, { largestUnit: "year" });
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const round = (unit: Temporal.DateTimeUnit) =>
    fromZDT.since(toZDT, {
      largestUnit: unit,
      smallestUnit: unit,
      roundingMode: "halfExpand",
    });

  if (rough.years) return rtf.format(round("year").years, "year");
  if (rough.months) return rtf.format(round("month").months, "month");
  if (rough.days) return rtf.format(round("day").days, "day");
  if (rough.hours) return rtf.format(round("hour").hours, "hour");
  if (rough.minutes) return rtf.format(round("minute").minutes, "minute");
  return rtf.format(round("second").seconds, "second");
};

export const parseDate = (date?: string): Temporal.PlainDate | undefined => {
  if (!date) return;

  try {
    return Temporal.PlainDate.from(date);
  } catch {
    return;
  }
};

export const parseInstant = (date?: string): Temporal.Instant | undefined => {
  if (!date) return;

  try {
    return Temporal.Instant.from(date);
  } catch {
    return;
  }
};
