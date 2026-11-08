import { describe, expect, it } from "vitest";
import {
  type CropRect,
  cropPixels,
  cropSizeVerdict,
  FULL_FRAME,
  heightForWidth,
  judgedCropSizeVerdict,
  largestCenteredRect,
  moveRect,
  refitRect,
  resizeRect,
  rotatedSize,
  widthForHeight,
} from "../geometry";

const isInside = (rect: CropRect) =>
  rect.x >= 0 &&
  rect.y >= 0 &&
  rect.width > 0 &&
  rect.height > 0 &&
  rect.x + rect.width <= 1 + 1e-9 &&
  rect.y + rect.height <= 1 + 1e-9;

const aspectOf = (rect: CropRect, imageAspect: number) =>
  (rect.width * imageAspect) / rect.height;

const PORTRAIT = 2 / 3;
const LANDSCAPE = 16 / 9;

describe("rotatedSize", () => {
  it("leaves an unturned image alone", () => {
    expect(rotatedSize(200, 300, 0)).toEqual({ width: 200, height: 300 });
  });

  it("swaps the sides on a quarter turn", () => {
    const turned = rotatedSize(200, 300, 90);
    expect(turned.width).toBeCloseTo(300);
    expect(turned.height).toBeCloseTo(200);
  });

  it("grows the canvas rather than clipping the corners", () => {
    const turned = rotatedSize(200, 300, 10);
    expect(turned.width).toBeGreaterThan(200);
    expect(turned.height).toBeGreaterThan(300);
    // And by the same amount either way.
    expect(rotatedSize(200, 300, -10)).toEqual(turned);
  });
});

describe("largestCenteredRect", () => {
  it("keeps the whole image when nothing is locked", () => {
    expect(largestCenteredRect(undefined, PORTRAIT)).toEqual(FULL_FRAME);
  });

  it("fills an image that already has the wanted shape", () => {
    const rect = largestCenteredRect(PORTRAIT, PORTRAIT);
    expect(rect.width).toBeCloseTo(1);
    expect(rect.height).toBeCloseTo(1);
  });

  it("is centred and inside, whatever the shapes", () => {
    for (const target of [PORTRAIT, LANDSCAPE, 1, 3 / 4]) {
      for (const image of [PORTRAIT, LANDSCAPE, 1, 9 / 16]) {
        const rect = largestCenteredRect(target, image);

        expect(isInside(rect)).toBe(true);
        expect(aspectOf(rect, image)).toBeCloseTo(target);
        expect(rect.x + rect.width / 2).toBeCloseTo(0.5);
        expect(rect.y + rect.height / 2).toBeCloseTo(0.5);

        // Largest, so one side has to be touching
        expect(Math.max(rect.width, rect.height)).toBeCloseTo(1);
      }
    }
  });
});

describe("heightForWidth / widthForHeight", () => {
  it("gives a frame the aspect asked for, and inverts", () => {
    const height = heightForWidth(0.5, PORTRAIT, LANDSCAPE);
    const rect = { ...FULL_FRAME, width: 0.5, height };
    expect(aspectOf(rect, LANDSCAPE)).toBeCloseTo(PORTRAIT);
    expect(widthForHeight(height, PORTRAIT, LANDSCAPE)).toBeCloseTo(0.5);
  });
});

describe("moveRect", () => {
  const rect: CropRect = {
    x: 0.25,
    y: 0.25,
    width: 0.5,
    height: 0.5,
    angle: 0,
  };

  it("slides by the delta", () => {
    expect(moveRect(rect, 0.1, -0.1)).toMatchObject({ x: 0.35, y: 0.15 });
  });

  it("stops at the edges rather than leaving the image", () => {
    expect(moveRect(rect, -10, -10)).toMatchObject({ x: 0, y: 0 });
    expect(moveRect(rect, 10, 10)).toMatchObject({ x: 0.5, y: 0.5 });
  });

  it("keeps the size when it hits a border", () => {
    const pushed = moveRect(rect, 10, 10);
    expect(pushed.width).toBe(rect.width);
    expect(pushed.height).toBe(rect.height);
  });
});

describe("resizeRect", () => {
  const start: CropRect = { x: 0.2, y: 0.2, width: 0.6, height: 0.6, angle: 0 };

  it("holds the opposite corner still", () => {
    const resized = resizeRect({
      rect: start,
      handle: "se",
      dx: -0.1,
      dy: -0.1,
      targetAspect: undefined,
      imageAspect: 1,
    });
    expect(resized.x).toBeCloseTo(0.2);
    expect(resized.y).toBeCloseTo(0.2);
    expect(resized.width).toBeLessThan(start.width);
  });

  it("grows from the anchored corner when dragged north-west", () => {
    const resized = resizeRect({
      rect: start,
      handle: "nw",
      dx: -0.1,
      dy: -0.1,
      targetAspect: undefined,
      imageAspect: 1,
    });
    expect(resized.x + resized.width).toBeCloseTo(0.8);
    expect(resized.y + resized.height).toBeCloseTo(0.8);
  });

  it("holds the aspect through every corner and drag", () => {
    for (const handle of ["nw", "ne", "sw", "se"] as const) {
      for (const dx of [-0.5, -0.2, -0.01, 0.01, 0.2, 0.5]) {
        for (const dy of [-0.5, -0.2, -0.01, 0.01, 0.2, 0.5]) {
          for (const image of [PORTRAIT, LANDSCAPE, 1]) {
            const resized = resizeRect({
              rect: start,
              handle: handle,
              dx: dx,
              dy: dy,
              targetAspect: PORTRAIT,
              imageAspect: image,
            });

            expect(isInside(resized)).toBe(true);
            expect(aspectOf(resized, image)).toBeCloseTo(PORTRAIT, 3);
          }
        }
      }
    }
  });

  it("stays inside the image when unlocked too", () => {
    for (const handle of ["nw", "ne", "sw", "se"] as const) {
      for (const dx of [-2, -0.3, 0.3, 2]) {
        for (const dy of [-2, -0.3, 0.3, 2]) {
          expect(
            isInside(
              resizeRect({
                rect: start,
                handle: handle,
                dx: dx,
                dy: dy,
                targetAspect: undefined,
                imageAspect: 1,
              }),
            ),
          ).toBe(true);
        }
      }
    }
  });
});

describe("resizeRect with a pinned line", () => {
  const start: CropRect = { x: 0.2, y: 0.2, width: 0.6, height: 0.6, angle: 0 };
  const lineOf = (rect: CropRect, position: number) =>
    rect.y + rect.height * position;

  it("keeps the line on the same row of the image while the frame grows", () => {
    const resized = resizeRect({
      rect: start,
      handle: "se",
      dx: 0.2,
      dy: 0.2,
      targetAspect: undefined,
      imageAspect: 1,
      pin: { axis: "y", position: 0.5 },
    });
    expect(resized.height).toBeCloseTo(0.8);
    expect(lineOf(resized, 0.5)).toBeCloseTo(lineOf(start, 0.5));
  });

  it("stops growing where keeping the line would push the frame off the image", () => {
    const resized = resizeRect({
      rect: start,
      handle: "se",
      dx: 1,
      dy: 1,
      targetAspect: undefined,
      imageAspect: 1,
      pin: { axis: "y", position: 0.25 },
    });
    expect(lineOf(resized, 0.25)).toBeCloseTo(lineOf(start, 0.25));
    expect(resized.y).toBeGreaterThanOrEqual(0);
    expect(resized.y + resized.height).toBeLessThanOrEqual(1 + 1e-9);
    expect(resized.height).toBeCloseTo(0.65 / 0.75);
  });

  it("keeps the shape lock while pinned", () => {
    const resized = resizeRect({
      rect: { x: 0.1, y: 0.1, width: 0.4, height: 0.4, angle: 0 },
      handle: "se",
      dx: 0.3,
      dy: 0.3,
      targetAspect: 2 / 3,
      imageAspect: 2 / 3,
      pin: { axis: "y", position: 0.5 },
    });
    expect(resized.width / resized.height).toBeCloseTo(1);
    expect(lineOf(resized, 0.5)).toBeCloseTo(0.3);
  });
});

describe("refitRect", () => {
  it("restores the shape after the image changes proportions", () => {
    const rect: CropRect = {
      x: 0.1,
      y: 0.1,
      width: 0.8,
      height: 0.8,
      angle: 5,
    };
    const refitted = refitRect(rect, PORTRAIT, LANDSCAPE);

    expect(isInside(refitted)).toBe(true);
    expect(aspectOf(refitted, LANDSCAPE)).toBeCloseTo(PORTRAIT);
  });

  // Straightening would be unusable if the frame jumped back to the middle every time the angle nudged
  it("keeps the frame where it was", () => {
    const rect: CropRect = {
      x: 0.05,
      y: 0.05,
      width: 0.4,
      height: 0.4,
      angle: 0,
    };
    const refitted = refitRect(rect, undefined, 1);

    expect(refitted.x + refitted.width / 2).toBeCloseTo(
      rect.x + rect.width / 2,
    );
    expect(refitted.y + refitted.height / 2).toBeCloseTo(
      rect.y + rect.height / 2,
    );
  });

  it("carries the angle through", () => {
    expect(refitRect({ ...FULL_FRAME, angle: 7 }, undefined, 1).angle).toBe(7);
  });

  it("pulls an oversized frame back inside", () => {
    const refitted = refitRect(
      { x: 0.9, y: 0.9, width: 0.5, height: 0.5, angle: 0 },
      undefined,
      1,
    );
    expect(isInside(refitted)).toBe(true);
  });
});

describe("cropSizeVerdict", () => {
  const verdict = (output: [number, number], source?: [number, number]) =>
    cropSizeVerdict(
      { width: output[0], height: output[1] },
      source && { width: source[0], height: source[1] },
    );

  it("says nothing at or above the usable floor, however much was cut", () => {
    expect(verdict([600, 900], [2000, 3000])).toBe("ok");
    expect(verdict([800, 1200], [1539, 2309])).toBe("ok");
  });

  it("measures the floor by area, so a wide crop is not judged by a tall one's shape", () => {
    expect(verdict([1280, 720], [1920, 1080])).toBe("ok");
  });

  it("stays yellow under the floor while the original has little more to give", () => {
    expect(verdict([599, 898], [600, 900])).toBe("marginal");
    expect(verdict([450, 675], [600, 900])).toBe("marginal");
  });

  it("turns red under the floor once three quarters of an axis is gone", () => {
    expect(verdict([449, 673], [600, 900])).toBe("too-small");
  });

  it("skips yellow entirely when the original was large enough to do better", () => {
    expect(verdict([700, 1050], [1000, 1500])).toBe("ok");
    expect(verdict([599, 898], [1000, 1500])).toBe("too-small");
  });

  it("can only answer the floor without an original to compare against", () => {
    expect(verdict([400, 600])).toBe("marginal");
    expect(verdict([600, 900])).toBe("ok");
  });
});

describe("judgedCropSizeVerdict", () => {
  // The one home of the Detail exemption: a tattoo cut from a giant photo is meant to be a small fraction of it
  it("never judges a Detail shot", () => {
    expect(
      judgedCropSizeVerdict(
        { width: 100, height: 150 },
        { width: 2000, height: 3000 },
        ["SHOT_DETAIL"],
      ),
    ).toBeUndefined();
  });

  it("judges everything else by the plain verdict", () => {
    expect(
      judgedCropSizeVerdict(
        { width: 100, height: 150 },
        { width: 2000, height: 3000 },
        ["CROP_FACE"],
      ),
    ).toBe("too-small");
  });
});

describe("cropPixels", () => {
  const at = (rect: Partial<CropRect>, width = 800, height = 1200) =>
    cropPixels({ ...FULL_FRAME, ...rect }, width, height);

  it("gives the whole image back for the whole frame", () => {
    expect(at({})).toEqual({ left: 0, top: 0, width: 800, height: 1200 });
  });

  it("measures a quarter frame wherever it sits", () => {
    expect(at({ x: 0, y: 0, width: 0.5, height: 0.5 })).toEqual({
      left: 0,
      top: 0,
      width: 400,
      height: 600,
    });
    expect(at({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 })).toEqual({
      left: 400,
      top: 600,
      width: 400,
      height: 600,
    });
    expect(at({ x: 0.25, y: 0.25, width: 0.5, height: 0.5 })).toEqual({
      left: 200,
      top: 300,
      width: 400,
      height: 600,
    });
  });

  it("rounds to whole pixels", () => {
    expect(at({ width: 1 / 3, height: 1 / 3 })).toEqual({
      left: 0,
      top: 0,
      width: 267,
      height: 400,
    });
  });

  it("follows the canvas a rotation grows", () => {
    expect(at({ angle: 90 }, 1000, 1500)).toMatchObject({
      width: 1500,
      height: 1000,
    });
    expect(at({ angle: 45 }, 1000, 1000)).toMatchObject({
      width: 1414,
      height: 1414,
    });
  });

  it("never reaches past the edge, and never asks for nothing", () => {
    for (const width of [1, 2, 3, 7, 33, 100, 799, 800]) {
      for (const height of [1, 2, 3, 7, 33, 100, 799, 1201]) {
        for (const f of [0.001, 0.1, 1 / 3, 0.5, 0.667, 0.9, 0.999]) {
          const got = at(
            { x: 1 - f, y: 1 - f, width: f, height: f },
            width,
            height,
          );

          expect(got.width).toBeGreaterThanOrEqual(1);
          expect(got.height).toBeGreaterThanOrEqual(1);
          expect(got.left + got.width).toBeLessThanOrEqual(width);
          expect(got.top + got.height).toBeLessThanOrEqual(height);
        }
      }
    }
  });
});
