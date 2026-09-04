import cx from "classnames";
import type { FC } from "react";
import {
  type CropGuide,
  CropGuideAxisEnum,
  CropGuideRoleEnum,
} from "src/graphql";

import { largestCenteredRect } from "./geometry";

const CLASSNAME = "CropOverlay";

export interface CropTemplateInfo {
  aspectRatio: number;
  guides: CropGuide[];
}

interface CropOverlayProps {
  guides: CropGuide[];
  /**
   * Lines the current drag is holding still, as fractions of the frame. Marked
   * so a resize that behaves differently also looks different
   */
  held?: { x?: number; y?: number };
  /**
   * Shrink the overlay to a box of the template's shape, centred, instead of
   * filling whatever it is placed in
   *
   * For drawing over a finished image, whose proportions are its own and need
   * not be the template's. Without this the geometry is stretched onto the
   * picture and an image that does not fit the frame is drawn as though it
   * does which is the one thing the overlay is there to disprove.
   *
   * Not wanted inside the cropping tool, where the box the overlay sits in is
   * already the frame and already the right shape
   */
  fit?: { templateAspect: number; imageAspect: number };
}

/** How far from filling its box before the frame edge is worth drawing */
const INSET_EPSILON = 0.005;

/**
 * A template's guide lines, drawn over whatever box this is placed in
 *
 * Positioned with percentages rather than drawn into an SVG viewBox, so the
 * lines stay one pixel wide whatever shape the box is. A stretched viewBox
 * gives horizontal and vertical strokes different weights, which reads as a
 * rendering fault
 *
 * Named lines are the ones meant to be lined up on (the eye line, where the
 * thighs meet) and labelling the thirds and margins as well turns a frame into
 * a wall of text. The rest still carry their name as a tooltip
 *
 * That is anchor and reference roles, or the pivot, not anchors alone: a
 * reference line ("under the bust", "where the thighs meet") is exactly the
 * kind of guidance worth reading at a glance, and margins are the case the
 * wall-of-text rule was written for
 */
const CropOverlay: FC<CropOverlayProps> = ({ guides, held, fit }) => {
  // The largest box of the template's shape that fits the picture, centred:
  // the same rectangle the cropping tool starts a frame at, and for the same
  // reason. It is where the crop would be if it were being made now
  const frame = fit
    ? largestCenteredRect(fit.templateAspect, fit.imageAspect)
    : undefined;

  // Only worth drawing an edge when there is something outside it. On an image
  // that already fits, the border would land exactly on the picture's own edge
  // and read as a stray line
  const inset =
    frame !== undefined &&
    (frame.width < 1 - INSET_EPSILON || frame.height < 1 - INSET_EPSILON);

  // Every template is meant to carry two hard anchors per axis it uses one on
  // -- the edge closest to 0 is the primary (drawn red), the other secondary
  // (yellow) -- so the rank comes from position order within the axis rather
  // than from any field the data itself carries. A template that only has one
  // ANCHOR guide on an axis (most of them, today) just shows a lone primary;
  // there is nothing to rank it against yet.
  const anchorRank = new Map<CropGuide, number>();
  const anchorsByAxis = new Map<CropGuideAxisEnum, CropGuide[]>();
  for (const guide of guides) {
    if (guide.role !== CropGuideRoleEnum.ANCHOR) continue;
    const axisGuides = anchorsByAxis.get(guide.axis) ?? [];
    axisGuides.push(guide);
    anchorsByAxis.set(guide.axis, axisGuides);
  }
  for (const axisGuides of anchorsByAxis.values()) {
    axisGuides.sort((a, b) => a.position - b.position);
    axisGuides.forEach((guide, rank) => {
      anchorRank.set(guide, rank);
    });
  }

  return (
    <div
      className={cx(CLASSNAME, { [`${CLASSNAME}-inset`]: inset })}
      style={
        frame && {
          left: `${frame.x * 100}%`,
          top: `${frame.y * 100}%`,
          width: `${frame.width * 100}%`,
          height: `${frame.height * 100}%`,
        }
      }
    >
      {guides.map((guide) => {
        const vertical = guide.axis === CropGuideAxisEnum.X;
        const percent = `${guide.position * 100}%`;
        const rank = anchorRank.get(guide);
        const soft =
          guide.role !== CropGuideRoleEnum.ANCHOR &&
          guide.role !== CropGuideRoleEnum.MARGIN;
        const labelled = guide.role !== CropGuideRoleEnum.MARGIN;
        const holdAt = vertical ? held?.x : held?.y;
        const isHeld =
          holdAt !== undefined && Math.abs(holdAt - guide.position) < 1e-6;

        return (
          <div
            key={`${guide.axis}-${guide.position}`}
            className={cx(`${CLASSNAME}-guide`, {
              [`${CLASSNAME}-guide-vertical`]: vertical,
              [`${CLASSNAME}-guide-horizontal`]: !vertical,
              [`${CLASSNAME}-guide-anchor-primary`]: rank === 0,
              [`${CLASSNAME}-guide-anchor-secondary`]:
                rank !== undefined && rank > 0,
              [`${CLASSNAME}-guide-soft`]: soft,
              [`${CLASSNAME}-guide-margin`]:
                guide.role === CropGuideRoleEnum.MARGIN,
              [`${CLASSNAME}-guide-held`]: isHeld,
            })}
            style={vertical ? { left: percent } : { top: percent }}
            title={guide.label ?? undefined}
          >
            {(labelled || guide.pivot) && guide.label && (
              <span
                className={cx(`${CLASSNAME}-label`, {
                  [`${CLASSNAME}-label-soft`]: soft,
                })}
              >
                {guide.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CropOverlay;
