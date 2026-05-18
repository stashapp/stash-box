import { describe, expect, it } from "vitest";
import {
  formatBodyModification,
  formatBodyModifications,
  formatCareer,
  formatDisambiguation,
  formatDuration,
  formatMeasurements,
  formatPendingEdits,
  getBraSize,
  getImage,
  imageType,
  parseBraSize,
  parseDuration,
  sortImageURLs,
} from "../transforms";

describe("formatCareer", () => {
  it("returns undefined when both blank", () => {
    expect(formatCareer(null, null)).toBeUndefined();
    expect(formatCareer()).toBeUndefined();
  });

  it("formats start–end", () => {
    expect(formatCareer(2010, 2020)).toBe("Active 2010–2020");
  });

  it("uses ???? when start missing", () => {
    expect(formatCareer(null, 2020)).toBe("Active ????–2020");
  });

  it("uses empty when end missing", () => {
    expect(formatCareer(2010, null)).toBe("Active 2010–");
  });
});

describe("formatMeasurements", () => {
  it("returns undefined when all empty", () => {
    expect(formatMeasurements({})).toBeUndefined();
  });

  it("formats bust-waist-hip", () => {
    expect(
      formatMeasurements({
        cup_size: "C",
        band_size: 32,
        waist_size: 24,
        hip_size: 34,
      }),
    ).toBe("32C-24-34");
  });

  it("uses placeholders for missing parts", () => {
    expect(formatMeasurements({ band_size: 32 })).toBe("32?-??-??");
  });
});

describe("getBraSize / parseBraSize", () => {
  it("round-trips 32C", () => {
    expect(getBraSize("C", 32)).toBe("32C");
    expect(parseBraSize("32C")).toEqual(["C", 32]);
  });

  it("returns undefined when partial", () => {
    expect(getBraSize(null, 32)).toBeUndefined();
    expect(getBraSize("C", null)).toBeUndefined();
  });

  it("parseBraSize handles empty input", () => {
    expect(parseBraSize()).toEqual([null, null]);
    expect(parseBraSize("")).toEqual([null, null]);
  });

  it("parseBraSize uppercases", () => {
    expect(parseBraSize("32c")).toEqual(["C", 32]);
  });
});

describe("formatDuration / parseDuration", () => {
  it("formats seconds only", () => {
    expect(formatDuration(45)).toBe("00:45");
  });

  it("formats minutes:seconds", () => {
    expect(formatDuration(125)).toBe("02:05");
  });

  it("formats hours:minutes:seconds", () => {
    expect(formatDuration(3665)).toBe("1:01:05");
  });

  it("returns empty for falsy input", () => {
    expect(formatDuration(0)).toBe("");
    expect(formatDuration(null)).toBe("");
    expect(formatDuration(undefined)).toBe("");
  });

  it("parses MM:SS", () => {
    expect(parseDuration("02:05")).toBe(125);
  });

  it("parses H:MM:SS", () => {
    expect(parseDuration("1:01:05")).toBe(3665);
  });

  it("returns null for empty", () => {
    expect(parseDuration(null)).toBeNull();
    expect(parseDuration("")).toBeNull();
  });

  it("returns null for invalid format", () => {
    expect(parseDuration("abc")).toBeNull();
  });
});

describe("formatBodyModification / formatBodyModifications", () => {
  it("returns null when input missing", () => {
    expect(formatBodyModification()).toBeNull();
    expect(formatBodyModification(null)).toBeNull();
  });

  it("formats with description", () => {
    expect(
      formatBodyModification({ location: "arm", description: "rose" }),
    ).toBe("arm (rose)");
  });

  it("formats without description", () => {
    expect(formatBodyModification({ location: "arm" })).toBe("arm");
  });

  it("joins multiple", () => {
    expect(
      formatBodyModifications([
        { location: "arm", description: "rose" },
        { location: "leg" },
      ]),
    ).toBe("arm (rose), leg");
  });

  it("returns empty string for no mods", () => {
    expect(formatBodyModifications()).toBe("");
    expect(formatBodyModifications([])).toBe("");
  });
});

describe("formatPendingEdits", () => {
  it("returns empty string when count is 0", () => {
    expect(formatPendingEdits(0)).toBe("");
    expect(formatPendingEdits()).toBe("");
  });

  it("formats count", () => {
    expect(formatPendingEdits(3)).toBe(" (3 Pending)");
  });
});

describe("formatDisambiguation", () => {
  it("returns empty string when missing", () => {
    expect(formatDisambiguation({})).toBe("");
  });

  it("wraps in parens", () => {
    expect(formatDisambiguation({ disambiguation: "the second" })).toBe(
      " (the second)",
    );
  });
});

describe("sortImageURLs / getImage / imageType", () => {
  const img = (width: number, height: number) => ({
    url: `${width}x${height}`,
    width,
    height,
  });

  it("sortImageURLs prefers portrait aspect when orientation=portrait", () => {
    const out = sortImageURLs(
      [img(100, 50), img(50, 100), img(100, 100)],
      "portrait",
    );
    expect(out[0].url).toBe("50x100");
  });

  it("sortImageURLs prefers landscape aspect when orientation=landscape", () => {
    const out = sortImageURLs(
      [img(100, 50), img(50, 100), img(100, 100)],
      "landscape",
    );
    expect(out[0].url).toBe("100x50");
  });

  it("getImage returns the first URL after sort", () => {
    expect(getImage([img(100, 50), img(50, 100)], "portrait")).toBe("50x100");
  });

  it("imageType returns vertical for tall images", () => {
    expect(imageType(img(50, 100))).toBe("vertical-img");
  });

  it("imageType returns horizontal otherwise", () => {
    expect(imageType(img(100, 50))).toBe("horizontal-img");
    expect(imageType(undefined)).toBe("horizontal-img");
  });
});
