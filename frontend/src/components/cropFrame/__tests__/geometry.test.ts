import { describe, expect, it } from "vitest";
import {
  type CropRect,
  cropPixels,
  FULL_FRAME,
  heightForWidth,
  isRoundSize,
  largestCenteredRect,
  moveRect,
  refitRect,
  resizeRect,
  rotatedSize,
  snapWidth,
  widthForHeight,
} from "../geometry";

const isInside = (rect: CropRect) =>
  rect.x >= 0 &&
  rect.y >= 0 &&
  rect.width > 0 &&
  rect.height > 0 &&
  rect.x + rect.width <= 1 + 1e-9 &&
  rect.y + rect.height <= 1 + 1e-9;

/**
 * The pixel aspect a frame actually has, which is the thing being locked
 *
 * Not `width / height`: those are fractions of two different spans, so a
 * half-by-half frame on a 2:3 image is 2:3, not square. Every one of these
 * tests would pass against a broken implementation if it compared the
 * fractions directly
 */
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

        // Largest, so one side has to be touching.
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

  // The shape is usually what someone cares about most, so hitting a border
  // must not quietly resize the frame.
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

  // The point of locking: a frame that could be pulled out of shape at the
  // edges produces uploads that miss the ratio, which is what a template
  // exists to prevent
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

  // Straightening would be unusable if the frame jumped back to the middle
  // every time the angle nudged.
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

describe("resizeRect holding a guide", () => {
  const start: CropRect = { x: 0.2, y: 0.2, width: 0.6, height: 0.6, angle: 0 };

  /** Where a guide at fraction p of the frame lands on the image. */
  const onImage = (edge: number, size: number, p: number) => edge + p * size;

  // The whole point: line the eye line up on the eyes, then size the frame to
  // the head without losing the alignment
  it("keeps the held line where it was", () => {
    const eyes = 0.425;
    const held = onImage(start.y, start.height, eyes);

    for (const handle of ["nw", "ne", "sw", "se"] as const) {
      for (const dy of [-0.3, -0.05, 0.05, 0.3]) {
        const resized = resizeRect({
          rect: start,
          handle,
          dx: 0,
          dy,
          imageAspect: 1,
          hold: { y: eyes },
        });
        expect(onImage(resized.y, resized.height, eyes)).toBeCloseTo(held);
      }
    }
  });

  it("holds both axes at once", () => {
    const hold = { x: 0.5, y: 0.425 };
    const heldX = onImage(start.x, start.width, hold.x);
    const heldY = onImage(start.y, start.height, hold.y);

    const resized = resizeRect({
      rect: start,
      handle: "se",
      dx: 0.1,
      dy: 0.1,
      targetAspect: undefined,
      imageAspect: 1,
      hold: hold,
    });

    expect(onImage(resized.x, resized.width, hold.x)).toBeCloseTo(heldX);
    expect(onImage(resized.y, resized.height, hold.y)).toBeCloseTo(heldY);
  });

  // A held frame that could be pulled out of shape would defeat the template
  // just as surely as an unheld one.
  it("keeps the aspect, and the line, together", () => {
    const hold = { x: 0.5, y: 0.425 };
    const heldY = onImage(start.y, start.height, hold.y);

    for (const handle of ["nw", "ne", "sw", "se"] as const) {
      for (const d of [-0.4, -0.1, 0.1, 0.4]) {
        const resized = resizeRect({
          rect: start,
          handle,
          dx: d,
          dy: d,
          targetAspect: PORTRAIT,
          imageAspect: LANDSCAPE,
          hold,
        });

        expect(isInside(resized)).toBe(true);
        expect(aspectOf(resized, LANDSCAPE)).toBeCloseTo(PORTRAIT, 3);
        expect(onImage(resized.y, resized.height, hold.y)).toBeCloseTo(
          heldY,
          3,
        );
      }
    }
  });

  // Running out of room has to cost size, not alignment. Sliding the frame back
  // inside would break the one thing this mode exists to keep.
  it("stops growing rather than sliding off the line", () => {
    // A line near the top: the frame can only grow so far before its top edge
    // would leave the image.
    const hold = { y: 0.9 };
    const near: CropRect = {
      x: 0.1,
      y: 0.02,
      width: 0.5,
      height: 0.1,
      angle: 0,
    };
    const held = onImage(near.y, near.height, hold.y);

    const resized = resizeRect({
      rect: near,
      handle: "se",
      dx: 0,
      dy: 5,
      targetAspect: undefined,
      imageAspect: 1,
      hold: hold,
    });

    expect(isInside(resized)).toBe(true);
    expect(onImage(resized.y, resized.height, hold.y)).toBeCloseTo(held);
  });

  it("stays inside the image however it is dragged", () => {
    for (const handle of ["nw", "ne", "sw", "se"] as const) {
      for (const dx of [-2, -0.3, 0.3, 2]) {
        for (const dy of [-2, -0.3, 0.3, 2]) {
          for (const hold of [{ y: 0.1 }, { y: 0.9 }, { x: 0.5, y: 0.425 }]) {
            const resized = resizeRect({
              rect: start,
              handle,
              dx,
              dy,
              imageAspect: 1,
              hold,
            });
            expect(isInside(resized)).toBe(true);
          }
        }
      }
    }
  });

  // A guide at the very edge of the frame only constrains one side, and
  // dividing by its distance to the other would be a division by zero.
  it("copes with a line on the frame's own edge", () => {
    for (const p of [0, 1]) {
      const resized = resizeRect({
        rect: start,
        handle: "se",
        dx: 0.2,
        dy: 0.2,
        targetAspect: undefined,
        imageAspect: 1,
        hold: { y: p },
      });
      expect(isInside(resized)).toBe(true);
      expect(Number.isFinite(resized.y)).toBe(true);
      expect(Number.isFinite(resized.height)).toBe(true);
    }
  });

  // Without a hold it must behave exactly as before: the opposite corner stays.
  it("falls back to corner anchoring when nothing is held", () => {
    const plain = resizeRect({
      rect: start,
      handle: "se",
      dx: -0.1,
      dy: -0.1,
      targetAspect: undefined,
      imageAspect: 1,
    });
    const empty = resizeRect({
      rect: start,
      handle: "se",
      dx: -0.1,
      dy: -0.1,
      targetAspect: undefined,
      imageAspect: 1,
      hold: {},
    });

    expect(empty).toEqual(plain);
    expect(plain.x).toBeCloseTo(start.x);
    expect(plain.y).toBeCloseTo(start.y);
  });
});

/**
 * The counterpart of TestCropRectPixels and TestCropRectPixelsStayInsideTheImage
 * in internal/image/crop_test.go, using the same cases against the same sizes.
 * Two mirrors of one calculation, so a change to either that is not made to the
 * other shows up as a failure rather than as a number on screen that quietly
 * stops being true.
 */
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

  // Whole pixels, because that is what comes out the other end. Go rounds half
  // away from zero and JavaScript rounds half upward; every value here is
  // positive, which is what makes the two the same rule.
  it("rounds to whole pixels", () => {
    expect(at({ width: 1 / 3, height: 1 / 3 })).toEqual({
      left: 0,
      top: 0,
      width: 267,
      height: 400,
    });
  });

  // Rotation grows the canvas rather than clipping the corners, so a quarter
  // turn swaps the two dimensions.
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

  // The far edge is what gets checked, not the size: a frame at the bottom
  // corner has a size that fits the image comfortably while still reaching
  // outside it, so asserting on the size alone would miss the bug the clamps
  // are there to prevent.
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

describe("snapWidth", () => {
  // 3000px of canvas and a 2:3 frame, so a width of 1000 is the 1000 x 1500
  // that someone dragging a corner is trying to land on.
  const CANVAS = 3000;
  const px = (fraction: number, canvas = CANVAS) =>
    Math.round(fraction * canvas);
  const snapped = (wanted: number, canvas = CANVAS) =>
    px(snapWidth(wanted / canvas, canvas, PORTRAIT), canvas);

  it("pulls a near miss onto the round number", () => {
    expect(snapped(1012)).toBe(1000);
    expect(snapped(988)).toBe(1000);
  });

  // The height is not free: a locked frame is the template's shape, so the
  // width is the only thing to choose and the height follows from it.
  it("lands both dimensions on round numbers together", () => {
    const width = snapped(1012);
    expect(Math.round(width / PORTRAIT)).toBe(1500);
    expect(isRoundSize(width, Math.round(width / PORTRAIT))).toBe(true);
  });

  // 1000 x 1500 is what was being aimed at; 1025 x 1538 merely also has a
  // round width. The coarser candidate has to win where both are in reach.
  it("prefers the roundest pair within reach", () => {
    expect(snapped(1020)).toBe(1000);
  });

  // A pair is only as round as its uglier half. On a 16:9 template a width of
  // 1000 is rounder than 1600, but it produces a height of 563 where 1600
  // produces 900 -- so scoring the two together has to prefer the second, and
  // scoring the width alone gets it exactly backwards.
  it("judges the pair, not the width", () => {
    const wide = (wanted: number) =>
      px(snapWidth(wanted / CANVAS, CANVAS, LANDSCAPE));

    expect(wide(1010)).not.toBe(1000);
    expect(wide(1610)).toBe(1600);
    expect(Math.round(1600 / LANDSCAPE)).toBe(900);
  });

  // The ladder goes down to fives, so there is always something tidy nearby
  // and no dead zone where the readout goes back to being arbitrary. What the
  // tolerance governs is how far the frame may be pulled to reach it -- past
  // that the frame is not nearly right, it is somewhere else, and moving it
  // would be the tool overruling the person.
  it("never pulls a frame further than the tolerance", () => {
    for (let wanted = 900; wanted <= 1100; wanted += 1) {
      expect(Math.abs(snapped(wanted) - wanted)).toBeLessThanOrEqual(
        Math.max(4, wanted * 0.02),
      );
    }
  });

  it("does not reach a distant round number", () => {
    expect(snapped(1043)).not.toBe(1000);
    expect(snapped(1043)).not.toBe(1100);
  });

  it("never leaves the canvas", () => {
    for (const fraction of [0.5, 0.9, 0.99, 1]) {
      expect(snapWidth(fraction, CANVAS, PORTRAIT)).toBeLessThanOrEqual(1);
    }
  });

  // A snap that silently stopped working on smaller sources would be worse
  // than none, since those are exactly the uploads whose size is marginal.
  it("still finds something to land on when the image is small", () => {
    expect(snapped(102, 300)).toBe(100);
  });
});

describe("isRoundSize", () => {
  it("accepts a pair that was aimed at", () => {
    expect(isRoundSize(1000, 1500)).toBe(true);
  });

  it("rejects a pair that merely happened", () => {
    expect(isRoundSize(1012, 1518)).toBe(false);
    // Round on one axis only is not a size anybody chose.
    expect(isRoundSize(1010, 1515)).toBe(false);
  });
});

describe("resizeRect snapping", () => {
  // A 3000x4500 canvas with a 2:3 frame: the fractions and the pixels line up
  // simply enough that the snap is visible in the result.
  const CANVAS = 3000;
  const outputWidth = (rect: CropRect) => Math.round(rect.width * CANVAS);

  it("snaps the size when it knows the canvas", () => {
    const resized = resizeRect({
      rect: FULL_FRAME,
      handle: "se",
      dx: -0.66,
      dy: 0,
      targetAspect: PORTRAIT,
      imageAspect: PORTRAIT,
      canvasWidth: CANVAS,
    });
    expect(outputWidth(resized)).toBe(1000);
  });

  // The same drag with nothing to measure against has to be left alone, or the
  // snap would be happening on some other unit than pixels.
  it("leaves the size alone when it does not", () => {
    const resized = resizeRect({
      rect: FULL_FRAME,
      handle: "se",
      dx: -0.66,
      dy: 0,
      targetAspect: PORTRAIT,
      imageAspect: PORTRAIT,
    });
    expect(outputWidth(resized)).toBe(1020);
  });

  // Shift-resizing goes down an entirely separate path, and a snap wired into
  // only one of them would work until someone held Shift.
  it("snaps while holding a guide too", () => {
    const resized = resizeRect({
      rect: FULL_FRAME,
      handle: "se",
      dx: -0.66,
      dy: 0,
      targetAspect: PORTRAIT,
      imageAspect: PORTRAIT,
      hold: { y: 0.425 },
      canvasWidth: CANVAS,
    });
    expect(outputWidth(resized)).toBe(1000);
  });

  // Running out of image is not negotiable and a round number is.
  it("gives up the round number rather than leave the image", () => {
    const resized = resizeRect({
      rect: { x: 0.9, y: 0, width: 0.1, height: 0.1, angle: 0 },
      handle: "se",
      dx: 0.5,
      dy: 0,
      targetAspect: PORTRAIT,
      imageAspect: PORTRAIT,
      canvasWidth: CANVAS,
    });
    expect(isInside(resized)).toBe(true);
  });
});
