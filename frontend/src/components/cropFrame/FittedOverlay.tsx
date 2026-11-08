import type { FC } from "react";
import type { CropGuide } from "src/graphql";
import { useMeasuredAspect } from "src/hooks";
import CropOverlay from "./CropOverlay";
import { largestCenteredRect } from "./geometry";

const CLASSNAME = "CropFrame-overlay";

/**
 * Draws a template's geometry over the picture, not over the box the picture sits in
 *
 * The two are not the same. `.Image` carries the image's aspect ratio, but a
 * column that constrains it on both axes, as both the lightbox and the image
 * page do, leaves the box a different shape from the picture whenever the
 * constraint that binds is the one the ratio did not choose. `object-fit:
 * contain` then letterboxes the picture inside it, and an overlay drawn at 100%
 * of the box reaches past the photograph: differently at every viewport size,
 * which is worse than being wrong consistently
 *
 * So the box is measured and the picture's own rectangle computed from it,
 * which is the same arithmetic `object-fit: contain` does. The overlay is then
 * placed on that rectangle and fitted within it as usual
 */
const FittedOverlay: FC<{
  guides: CropGuide[];
  templateAspect: number;
  imageAspect: number;
}> = ({ guides, templateAspect, imageAspect }) => {
  const { ref: measure, aspect: boxAspect } = useMeasuredAspect();

  const picture = largestCenteredRect(imageAspect, boxAspect ?? imageAspect);

  return (
    <div className={`${CLASSNAME}-box`} ref={measure}>
      <div
        className={`${CLASSNAME}-picture`}
        style={{
          left: `${picture.x * 100}%`,
          top: `${picture.y * 100}%`,
          width: `${picture.width * 100}%`,
          height: `${picture.height * 100}%`,
          visibility: boxAspect === undefined ? "hidden" : undefined,
        }}
      >
        <CropOverlay guides={guides} fit={{ templateAspect, imageAspect }} />
      </div>
    </div>
  );
};

export default FittedOverlay;
