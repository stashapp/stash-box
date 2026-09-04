import { type CropGuide, CropGuideAxisEnum } from "src/graphql";

import type { HoldPoints } from "./geometry";

/**
 * The point on each axis to hold still when resizing with Shift
 *
 * The template says which line, and nothing here works it out. A guide carries
 * `pivot` for exactly this, separately from `role`: in a headshot the eye line
 * is the softest line in the template (the head and the chin are the hard limits)
 * and is still the right thing to resize about
 *
 * An axis with no pivot holds its centre, which is what every other editor does
 * with the modifier
 *
 * Only one point per axis can be held. Two would fix both the position and the
 * size, leaving nothing for the drag to change which is why the reader drops
 * both when a template claims two
 */
export const holdPointsFor = (guides: CropGuide[]): HoldPoints => {
  const pivotOn = (axis: CropGuideAxisEnum) =>
    guides.find((guide) => guide.axis === axis && guide.pivot)?.position ?? 0.5;

  return {
    x: pivotOn(CropGuideAxisEnum.X),
    y: pivotOn(CropGuideAxisEnum.Y),
  };
};
