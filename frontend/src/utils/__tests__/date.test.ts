import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";
import {
  formatISODate,
  isDateInRange,
  isInstantInFuture,
  isValidDate,
  maxBirthdate,
  maxDeathdate,
  maxReleaseDate,
  parseDate,
  parseInstant,
} from "../date";

describe("isValidDate", () => {
  it("returns true for undefined/empty", () => {
    expect(isValidDate()).toBe(true);
    expect(isValidDate("")).toBe(true);
  });

  it("returns true for YYYY-MM-DD", () => {
    expect(isValidDate("2024-05-17")).toBe(true);
  });

  it("returns false for invalid month/day", () => {
    expect(isValidDate("2024-13-01")).toBe(false);
    expect(isValidDate("2024-02-30")).toBe(false);
  });

  it("returns false for malformed input", () => {
    expect(isValidDate("not-a-date")).toBe(false);
  });
});

describe("isDateInRange", () => {
  it("returns true for empty input", () => {
    expect(isDateInRange(undefined)).toBe(true);
    expect(isDateInRange("")).toBe(true);
  });

  it("returns true when no end is given and date is after 1900", () => {
    expect(isDateInRange("2024-01-01")).toBe(true);
  });

  it("returns false when before MIN_DATE (1900-01-01)", () => {
    expect(isDateInRange("1899-12-31")).toBe(false);
  });

  it("returns true at MIN_DATE boundary", () => {
    expect(isDateInRange("1900-01-01")).toBe(true);
  });

  it("returns false when after end date", () => {
    const end = Temporal.PlainDate.from("2024-01-01");
    expect(isDateInRange("2024-01-02", end)).toBe(false);
  });

  it("returns true at end boundary", () => {
    const end = Temporal.PlainDate.from("2024-01-01");
    expect(isDateInRange("2024-01-01", end)).toBe(true);
  });

  it("returns true for unparseable dates (delegated to isValidDate)", () => {
    expect(isDateInRange("nonsense")).toBe(true);
  });
});

describe("maxBirthdate / maxDeathdate / maxReleaseDate", () => {
  it("maxBirthdate is 18 years before today", () => {
    const expected = Temporal.Now.plainDateISO().add({ years: -18 });
    expect(maxBirthdate().toString()).toBe(expected.toString());
  });

  it("maxDeathdate is today", () => {
    expect(maxDeathdate().toString()).toBe(
      Temporal.Now.plainDateISO().toString(),
    );
  });

  it("maxReleaseDate is one year ahead", () => {
    const expected = Temporal.Now.plainDateISO().add({ years: 1 });
    expect(maxReleaseDate().toString()).toBe(expected.toString());
  });
});

describe("parseDate", () => {
  it("parses valid date", () => {
    expect(parseDate("2024-05-17")?.toString()).toBe("2024-05-17");
  });

  it("returns undefined for empty input", () => {
    expect(parseDate()).toBeUndefined();
    expect(parseDate("")).toBeUndefined();
  });

  it("returns undefined for invalid input", () => {
    expect(parseDate("garbage")).toBeUndefined();
  });
});

describe("parseInstant", () => {
  it("parses ISO instant", () => {
    expect(parseInstant("2024-05-17T00:00:00Z")?.toString()).toContain(
      "2024-05-17",
    );
  });

  it("returns undefined for invalid input", () => {
    expect(parseInstant("nope")).toBeUndefined();
    expect(parseInstant()).toBeUndefined();
  });
});

describe("isInstantInFuture", () => {
  it("returns true for a far-future instant", () => {
    const future = Temporal.Now.instant().add({ hours: 24 });
    expect(isInstantInFuture(future)).toBe(true);
  });

  it("returns false for a past instant", () => {
    const past = Temporal.Now.instant().add({ hours: -1 });
    expect(isInstantInFuture(past)).toBe(false);
  });
});

describe("formatISODate", () => {
  it("returns YYYY-MM-DD slice", () => {
    expect(formatISODate("2024-05-17T12:34:56Z")).toBe("2024-05-17");
  });

  it("accepts Date input", () => {
    expect(formatISODate(new Date("2024-05-17T00:00:00Z"))).toBe("2024-05-17");
  });
});
