import type { FC } from "react";
import type { CropTemplate } from "src/graphql";
import { useMeasuredAspect } from "src/hooks";
import CropOverlay from "./CropOverlay";
import { largestCenteredRect } from "./geometry";

const CLASSNAME = "CropFrame-overlay";

// Measures the box the picture is letterboxed in and draws over the picture's own rectangle
const FittedOverlay: FC<{
  template: CropTemplate | undefined;
  image: { width: number; height: number };
}> = ({ template, image }) => {
  const { ref: measure, aspect: boxAspect } = useMeasuredAspect();

  if (!template || !(image.width > 0) || !(image.height > 0)) {
    return null;
  }

  const imageAspect = image.width / image.height;
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
        <CropOverlay
          guides={template.guides}
          fit={{ templateAspect: template.aspect_ratio, imageAspect }}
        />
      </div>
    </div>
  );
};

export default FittedOverlay;
