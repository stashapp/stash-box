import cx from "classnames";
import { type FC, useEffect, useMemo, useState } from "react";
import { Button } from "react-bootstrap";
import CropFrame, {
  CropFrameControls,
  type CropRect,
  cropPixels,
  FULL_FRAME,
  isIdentity,
  judgedCropSizeVerdict,
  largestCenteredRect,
  MAX_ZOOM,
  rotatedSize,
} from "src/components/cropFrame";
import { LoadingIndicator } from "src/components/fragments";
import ImageCategorizationFields from "src/components/image/ImageCategorizationFields";
import type { ImageCategorization } from "src/components/image/types";
import type { ImageCropInput, ImageTypeEnum } from "src/graphql";
import { cropTemplateHref, maxImageDate, partialDateError } from "src/utils";

import { claimedCropType, type ImageTypeGroup } from "./types";

const CLASSNAME = "CropStep";

interface CropStepProps {
  file: File;
  groups: ImageTypeGroup[];
  uploading: boolean;
  onRemove: () => void;
  onUpload: (
    crop: ImageCropInput | undefined,
    types: ImageTypeEnum[],
    imageDate: string | null,
  ) => void;
}

/** Pick the crop this image is meant to be, drag its frame, send both; cropping is never required */
const CropStep: FC<CropStepProps> = ({
  file,
  groups,
  uploading,
  onRemove,
  onUpload,
}) => {
  const [src, setSrc] = useState<string>();
  const [size, setSize] = useState<{ width: number; height: number }>();
  const [failed, setFailed] = useState(false);
  const [rect, setRect] = useState<CropRect>(FULL_FRAME);
  const [zoom, setZoom] = useState(1);
  // Measured by CropFrame, so the zoom-in button stops at the real limit
  const [maxZoom, setMaxZoom] = useState(MAX_ZOOM);
  // Shaped like a gallery image so the same control serves both
  const [labels, setLabels] = useState<ImageCategorization>({
    types: [],
    date: null,
  });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    setFailed(false);

    let live = true;
    createImageBitmap(file, { imageOrientation: "from-image" })
      .then((bitmap) => {
        if (live) setSize({ width: bitmap.width, height: bitmap.height });
        bitmap.close();
      })
      .catch(() => {
        if (live) setFailed(true);
      });

    return () => {
      live = false;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // The crop-group types, for the reset sweep and the roomy layout switch
  const templates = useMemo(
    () => groups.flatMap((group) => group.types).filter((t) => t.crop_template),
    [groups],
  );
  const selected = claimedCropType(groups, labels.types);
  const aspectRatio = selected?.crop_template?.aspect_ratio;
  const guides = selected?.crop_template?.guides ?? [];

  const verdict = size
    ? judgedCropSizeVerdict(
        cropPixels(rect, size.width, size.height),
        size,
        labels.types,
      )
    : undefined;

  useEffect(() => {
    if (!size) {
      return;
    }
    setRect((previous) => {
      const turned = rotatedSize(size.width, size.height, previous.angle);
      return largestCenteredRect(
        aspectRatio,
        turned.width / turned.height,
        previous.angle,
      );
    });
  }, [aspectRatio, size]);

  const crops = !isIdentity(rect);
  // The server checks the date's format, not its range, so Upload is disabled the same way Apply is
  const dateValid = !partialDateError(labels.date, maxImageDate());

  const reset = () => {
    setLabels((previous) => ({
      ...previous,
      types: previous.types.filter(
        (type) => !templates.some((template) => template.key === type),
      ),
    }));
    setRect(FULL_FRAME);
  };

  const upload = () => {
    if (!dateValid) {
      return;
    }
    onUpload(
      crops
        ? {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            angle: rect.angle,
          }
        : undefined,
      // The crop type is a label whether or not the frame cut anything
      labels.types,
      labels.date ?? null,
    );
  };

  const loaded = src && size && !failed;
  const labellable = groups.some((group) => group.types.length > 0);
  // A scope with no templates gets the plain preview rather than an idle crop stage
  const croppable = templates.length > 0;

  return (
    <div
      className={cx(CLASSNAME, {
        [`${CLASSNAME}-roomy`]: croppable,
        [`${CLASSNAME}-uploading`]: uploading,
      })}
    >
      <div className={`${CLASSNAME}-columns`}>
        <div className={`${CLASSNAME}-image`}>
          {!croppable ? (
            src && (
              <div className={`${CLASSNAME}-preview`}>
                <img src={src} alt="" />
              </div>
            )
          ) : loaded ? (
            <div className={`${CLASSNAME}-card`}>
              <CropFrame
                src={src}
                naturalWidth={size.width}
                naturalHeight={size.height}
                aspectRatio={aspectRatio ?? undefined}
                guides={guides}
                value={rect}
                onChange={setRect}
                zoom={zoom}
                onZoomChange={setZoom}
                onZoomCeilingChange={setMaxZoom}
              />

              <CropFrameControls
                src={src}
                value={rect}
                onChange={setRect}
                aspectRatio={aspectRatio ?? undefined}
                naturalWidth={size.width}
                naturalHeight={size.height}
                guides={guides}
                zoom={zoom}
                onZoomChange={setZoom}
                maxZoom={maxZoom}
                sizeVerdict={verdict}
                templateDownloadHref={
                  selected ? cropTemplateHref(selected.key) : undefined
                }
              />
            </div>
          ) : (
            <div className={`${CLASSNAME}-loading`}>
              {failed ? (
                <div className="text-muted">
                  This file cannot be cropped. Upload it as it is.
                </div>
              ) : (
                <LoadingIndicator message="Reading image..." />
              )}
            </div>
          )}
          <div className="mt-4 d-flex gap-2">
            <Button variant="danger" onClick={onRemove} disabled={uploading}>
              Remove
            </Button>
            {crops && (
              <Button variant="secondary" onClick={reset} disabled={uploading}>
                Reset
              </Button>
            )}
            <Button onClick={upload} disabled={uploading || !dateValid}>
              {uploading
                ? "Uploading..."
                : crops
                  ? "Crop and upload"
                  : "Upload"}
            </Button>
          </div>
        </div>

        {labellable && (
          <div className={`${CLASSNAME}-panels`}>
            <ImageCategorizationFields
              groups={groups}
              value={labels}
              onChange={setLabels}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CropStep;
