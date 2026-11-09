import cx from "classnames";
import type { FC } from "react";
import { Tooltip } from "src/components/fragments";
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
  fit?: { templateAspect: number; imageAspect: number };
  // Whether the red line can be pinned with Shift here (the crop frame)
  pinHint?: boolean;
}

export const PIN_HINT = "Hold Shift while resizing to keep this line in place";

// How far from filling its box before the frame edge is worth drawing
const INSET_EPSILON = 0.005;

const EDGE_MARGIN = /^(left|right|top|bottom) margin$/i;

// The primary anchor is the landmark, never the line at the edge
const edgeDistance = (guide: CropGuide) =>
  Math.min(guide.position, 1 - guide.position);

/**
 * A template's guide lines, drawn over whatever box this is placed in
 *
 * Positioned with percentages rather than drawn into an SVG viewBox, so the
 * lines stay one pixel wide whatever shape the box is
 *
 * Named lines are the ones meant to be lined up on (the eye line, where the
 * thighs meet, the margin the body is cut at) and labelling the thirds and
 * edge margins as well turns a frame into a wall of text. The rest still
 * carry their name as a tooltip
 */
export const primaryAnchors = (guides: CropGuide[]) => {
  const primary = new Set<CropGuide>();
  const anchorsByAxis = new Map<CropGuideAxisEnum, CropGuide[]>();
  for (const guide of guides) {
    if (guide.role !== CropGuideRoleEnum.ANCHOR) continue;
    const axisGuides = anchorsByAxis.get(guide.axis) ?? [];
    axisGuides.push(guide);
    anchorsByAxis.set(guide.axis, axisGuides);
  }
  for (const axisGuides of anchorsByAxis.values()) {
    primary.add(
      axisGuides.reduce((best, guide) =>
        edgeDistance(guide) > edgeDistance(best) ? guide : best,
      ),
    );
  }
  return primary;
};

const CropOverlay: FC<CropOverlayProps> = ({ guides, fit, pinHint }) => {
  const frame = fit
    ? largestCenteredRect(fit.templateAspect, fit.imageAspect)
    : undefined;

  const inset =
    frame !== undefined &&
    (frame.width < 1 - INSET_EPSILON || frame.height < 1 - INSET_EPSILON);

  const primary = primaryAnchors(guides);

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
        const anchor = guide.role === CropGuideRoleEnum.ANCHOR;
        const soft = !anchor && guide.role !== CropGuideRoleEnum.MARGIN;
        const labelled =
          guide.role !== CropGuideRoleEnum.MARGIN ||
          !EDGE_MARGIN.test(guide.label ?? "");
        return (
          <div
            key={`${guide.axis}-${guide.position}`}
            className={cx(`${CLASSNAME}-guide`, {
              [`${CLASSNAME}-guide-vertical`]: vertical,
              [`${CLASSNAME}-guide-horizontal`]: !vertical,
              [`${CLASSNAME}-guide-anchor-primary`]: primary.has(guide),
              [`${CLASSNAME}-guide-anchor-secondary`]:
                anchor && !primary.has(guide),
              [`${CLASSNAME}-guide-soft`]: soft,
              [`${CLASSNAME}-guide-margin`]:
                guide.role === CropGuideRoleEnum.MARGIN,
            })}
            style={vertical ? { left: percent } : { top: percent }}
            title={guide.label ?? undefined}
          >
            {labelled && guide.label && (
              <Tooltip
                text={pinHint && primary.has(guide) ? PIN_HINT : ""}
                placement="top"
              >
                <span
                  className={cx(`${CLASSNAME}-label`, {
                    [`${CLASSNAME}-label-soft`]: soft,
                    [`${CLASSNAME}-label-pinnable`]:
                      pinHint && primary.has(guide),
                  })}
                >
                  {guide.label}
                </span>
              </Tooltip>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CropOverlay;
