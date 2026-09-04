import {
  type CropGuide,
  CropGuideAxisEnum,
  CropGuideRoleEnum,
} from "src/graphql";
import { describe, expect, it } from "vitest";

import { holdPointsFor } from "../holds";

const guide = (
  axis: CropGuideAxisEnum,
  position: number,
  role: CropGuideRoleEnum | null,
  pivot = false,
): CropGuide => ({
  __typename: "CropGuide" as const,
  axis,
  position,
  role,
  label: null,
  pivot,
});

const y = (position: number, role: CropGuideRoleEnum | null, pivot = false) =>
  guide(CropGuideAxisEnum.Y, position, role, pivot);
const x = (position: number, role: CropGuideRoleEnum | null, pivot = false) =>
  guide(CropGuideAxisEnum.X, position, role, pivot);

/**
 * The template says which line, and nothing here works it out.
 *
 * Guessing the anchor nearest the middle is tempting -- an interior anchor
 * reads as what a subject lines up on, while the ones at the extremes read
 * as framing limits -- but that guess is wrong for two of the seven shipped
 * templates. The cases below cover both the templates where the guess would
 * happen to hold and the ones where it would not, kept together so the
 * difference is legible.
 */
describe("holdPointsFor", () => {
  it("holds the line the template names", () => {
    const held = holdPointsFor([
      y(0.025, CropGuideRoleEnum.ANCHOR), // top of the head
      y(0.425, CropGuideRoleEnum.REFERENCE, true), // bisects the eyes
      y(0.77, CropGuideRoleEnum.ANCHOR), // bottom of the chin
    ]);
    expect(held.y).toBeCloseTo(0.425);
  });

  // The reason pivot is not another role value. A headshot's eye line is the
  // softest line in its template - the head and chin are the hard limits --
  // and is still the right thing to resize about, so no rule reading role can
  // reach it
  it("holds a soft line when that is what the template names", () => {
    const held = holdPointsFor([
      y(0.025, CropGuideRoleEnum.ANCHOR),
      y(0.425, CropGuideRoleEnum.REFERENCE, true),
    ]);
    expect(held.y).toBeCloseTo(0.425);
  });

  // One rule, exercised against three real templates that could each tempt a
  // different shortcut: without a named pivot the axis centres, whatever
  // else the template draws there.
  for (const [name, guides] of [
    [
      // CROP_FULL_BODY: the head and the feet, both framing limits,
      // equidistant from the middle. Breaking the tie by slice order would
      // resize about the top of the head -- the very edge being dragged.
      "two framing limits and no line named (CROP_FULL_BODY)",
      [y(0.01, CropGuideRoleEnum.ANCHOR), y(0.99, CropGuideRoleEnum.ANCHOR)],
    ],
    [
      // CROP_TORSO: one anchor, at the top of the hair. Being the only one
      // did not make it the right one.
      "a lone anchor (CROP_TORSO)",
      [
        y(0.01, CropGuideRoleEnum.ANCHOR),
        y(1 / 3, CropGuideRoleEnum.REFERENCE),
        y(2 / 3, CropGuideRoleEnum.REFERENCE),
      ],
    ],
    [
      // CROP_WIDE: margins and thirds and nothing to line a body up on, so
      // Shift becomes "resize about the middle" -- what every other editor
      // does with the modifier.
      "an axis the template says nothing about (CROP_WIDE)",
      [
        y(0.01, CropGuideRoleEnum.MARGIN),
        x(1 / 3, CropGuideRoleEnum.REFERENCE),
      ],
    ],
  ] as const) {
    it(`centres on ${name}`, () => {
      const held = holdPointsFor([...guides]);
      expect(held.y).toBeCloseTo(0.5);
      expect(held.x).toBeCloseTo(0.5);
    });
  }

  it("centres with no guides at all", () => {
    expect(holdPointsFor([])).toEqual({ x: 0.5, y: 0.5 });
  });

  it("treats the axes separately", () => {
    const held = holdPointsFor([
      y(0.425, CropGuideRoleEnum.REFERENCE, true),
      x(0.2, CropGuideRoleEnum.REFERENCE, true),
    ]);
    expect(held.y).toBeCloseTo(0.425);
    expect(held.x).toBeCloseTo(0.2);
  });

  // A pivot on one axis says nothing about the other, and must not be borrowed
  // across.
  it("does not let one axis answer for the other", () => {
    const held = holdPointsFor([
      y(0.425, CropGuideRoleEnum.REFERENCE, true),
      x(0.2, CropGuideRoleEnum.ANCHOR),
    ]);
    expect(held.y).toBeCloseTo(0.425);
    expect(held.x).toBeCloseTo(0.5);
  });

  // The reader drops both pivots when a template claims two on an axis, so
  // this should not arrive. If it does, the first is as arbitrary as the
  // second but it must still be a number, not undefined.
  it("returns a usable point even if two lines claim the axis", () => {
    const held = holdPointsFor([
      y(0.3, CropGuideRoleEnum.REFERENCE, true),
      y(0.6, CropGuideRoleEnum.REFERENCE, true),
    ]);
    expect(held.y).toBeGreaterThan(0);
    expect(held.y).toBeLessThan(1);
  });
});
