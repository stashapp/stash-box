import { describe, expect, it } from "vitest";

import { MAX_ZOOM, MIN_ZOOM, stepZoom, zoomCeiling } from "../zoom";

describe("stepZoom", () => {
  it("steps multiplicatively in both directions", () => {
    const up = stepZoom(2, 1);
    expect(up).toBeCloseTo(2.5);
    expect(stepZoom(up, -1)).toBeCloseTo(2);
  });

  it("clamps at the top", () => {
    expect(stepZoom(MAX_ZOOM, 1)).toBe(MAX_ZOOM);
    expect(stepZoom(MAX_ZOOM / 1.1, 1)).toBe(MAX_ZOOM);
  });

  it("snaps back onto the exact fit", () => {
    expect(stepZoom(1.25, -1)).toBe(MIN_ZOOM);
    expect(stepZoom(MIN_ZOOM, -1)).toBe(MIN_ZOOM);
  });
});

describe("zoomCeiling", () => {
  const VIEW = { width: 400, height: 600 };

  it("offers the full range when the frame is small in the view", () => {
    expect(zoomCeiling(1, { width: 40, height: 60 }, VIEW)).toBe(MAX_ZOOM);
  });

  it("stops where the frame would fill the view", () => {
    expect(zoomCeiling(1, { width: 200, height: 300 }, VIEW)).toBeCloseTo(2);
  });

  it("answers relative to the zoom it measured at", () => {
    expect(zoomCeiling(4, { width: 200, height: 300 }, VIEW)).toBeCloseTo(8);
  });

  it("comes back under the current zoom once the frame overflows", () => {
    const ceiling = zoomCeiling(4, { width: 800, height: 1200 }, VIEW);
    expect(ceiling).toBeCloseTo(2);
    expect(ceiling).toBeLessThan(4);
  });

  it("takes the tighter axis", () => {
    expect(zoomCeiling(1, { width: 100, height: 600 }, VIEW)).toBeCloseTo(1);
  });

  it("never asks for less than the plain fit", () => {
    expect(zoomCeiling(1, { width: 4000, height: 6000 }, VIEW)).toBe(MIN_ZOOM);
  });

  it("gives the full range before anything has been measured", () => {
    expect(zoomCeiling(1, { width: 0, height: 0 }, VIEW)).toBe(MAX_ZOOM);
  });
});
