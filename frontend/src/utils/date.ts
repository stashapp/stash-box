import { Temporal } from 'temporal-polyfill';

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

export const isValidDate = (date?: string) => {
  if (!date) return true
  try {
    Temporal.PlainDate.from(date)
    return true
  } catch {
    return false
  }
}

export const dateWithinRange = (
  date: string | undefined,
  start?: Temporal.PlainDate,
  end?: Temporal.PlainDate,
) => {
  if (!date || (!start && !end)) return true;

  let parsedDate: Temporal.PlainDate;
  try {
    parsedDate = Temporal.PlainDate.from(date)
  } catch {
    return true
  }

  if (start) {
    if (parsedDate < start) return false;
  }

  if (end) {
    if (parsedDate > end) return false;
  }

  return true;
};

export const formatDistance = (from: Temporal.Instant, to?: Temporal.Instant) => {
  const toInstant = to ?? Temporal.Now.instant();
  const tz = Temporal.Now.timeZoneId();
  const diff = from.toZonedDateTimeISO(tz).since(toInstant.toZonedDateTimeISO(tz), {
    largestUnit: "year",
  });

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (diff.years) return rtf.format(diff.years, "year");
  if (diff.months) return rtf.format(diff.months, "month");
  if (diff.days) return rtf.format(diff.days, "day");
  if (diff.hours) return rtf.format(diff.hours, "hour");
  if (diff.minutes) return rtf.format(diff.minutes, "minute");

  return rtf.format(diff.seconds, "second");
}

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
