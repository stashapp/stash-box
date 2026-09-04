import cx from "classnames";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import CropFrame, {
  CropFrameControls,
  type CropRect,
  FULL_FRAME,
  isIdentity,
  largestCenteredRect,
  rotatedSize,
} from "src/components/cropFrame";
import { LoadingIndicator } from "src/components/fragments";
import type {
  ImageCropInput,
  ImageTypeEnum,
  ImageTypeGroupsQuery,
} from "src/graphql";
import { maxImageDate, partialDateError } from "src/utils";

import ImageLabelsClassification from "./ImageLabelsClassification";
import ImageLabelsMetadata from "./ImageLabelsMetadata";

type ImageTypeGroup = ImageTypeGroupsQuery["imageTypeGroups"][number];

const CLASSNAME = "CropStep";

interface CropStepProps {
  file: File;
  groups: ImageTypeGroup[];
  onCropsChange?: (crops: boolean) => void;
  onDateValidChange?: (valid: boolean) => void;
  onUpload: (
    crop: ImageCropInput | undefined,
    types: ImageTypeEnum[],
    imageDate: string | null,
  ) => void;
}

export interface CropStepHandle {
  upload: () => void;
  reset: () => void;
}

/**
 * The step between choosing a file and uploading it: pick the crop this image
 * is meant to be, drag its frame over the picture, send both
 *
 * The frame and the label are chosen in one action, which is the point: a Crop
 * value applied afterwards is a judgement about a photograph but the one applied
 * here is a description of what was just done to it, and true by construction
 *
 * Cropping is never required. Doing nothing leaves a plain "Upload", exactly
 * as before any of this existed, because there are uploads no frame suits like a
 * close-up of a tattoo or a more artistic image from social media
 */
const CropStep = forwardRef<CropStepHandle, CropStepProps>(function CropStep(
  { file, groups, onCropsChange, onDateValidChange, onUpload },
  ref,
) {
  const [src, setSrc] = useState<string>();
  const [size, setSize] = useState<{ width: number; height: number }>();
  const [failed, setFailed] = useState(false);
  const [rect, setRect] = useState<CropRect>(FULL_FRAME);
  // Everything this image is being called, crop included. Shaped like a gallery
  // image so the same control serves both
  const [labels, setLabels] = useState<{
    types: ImageTypeEnum[];
    date?: string | null;
  }>({ types: [], date: null });

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

  const templates = useMemo(
    () => groups.flatMap((group) => group.types).filter((t) => t.crop_template),
    [groups],
  );

  const selected = templates.find((t) => labels.types.includes(t.key));
  const aspectRatio = selected?.crop_template?.aspect_ratio;
  const guides = selected?.crop_template?.guides ?? [];

  useEffect(() => {
    if (!size) return;
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

  useEffect(() => {
    onCropsChange?.(crops);
  }, [crops, onCropsChange]);

  const dateValid = !partialDateError(labels.date, maxImageDate());

  useEffect(() => {
    onDateValidChange?.(dateValid);
  }, [dateValid, onDateValidChange]);

  const reset = () => {
    setLabels((previous) => ({
      ...previous,
      types: previous.types.filter(
        (type) => !templates.some((template) => template.key === type),
      ),
    }));
    setRect(FULL_FRAME);
  };

  // Guarded here even though the Upload button driving this is itself
  // disabled while invalid: defence in depth costs nothing, and it is what
  // stands between a date the field is flagging as out of range and one
  // actually persisted to the server, which has no range check of its own.
  const upload = () => {
    if (!dateValid) return;
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
      // The crop type is a label whether or not the frame cut anything: an
      // image already the right shape is still that kind of picture
      labels.types,
      labels.date ?? null,
    );
  };

  useImperativeHandle(ref, () => ({ upload, reset }));

  const loaded = src && size && !failed;
  const labellable = groups.some((group) => group.types.length > 0);

  return (
    <div
      className={cx(CLASSNAME, {
        [`${CLASSNAME}-roomy`]: templates.length > 0,
      })}
    >
      <div className={`${CLASSNAME}-columns`}>
        <div className={`${CLASSNAME}-image`}>
          {loaded ? (
            <div className={`${CLASSNAME}-card`}>
              <CropFrame
                src={src}
                naturalWidth={size.width}
                naturalHeight={size.height}
                aspectRatio={aspectRatio ?? undefined}
                guides={guides}
                value={rect}
                onChange={setRect}
                hideControls
              />

              <CropFrameControls
                src={src}
                value={rect}
                onChange={setRect}
                aspectRatio={aspectRatio ?? undefined}
                naturalWidth={size.width}
                naturalHeight={size.height}
                guides={guides}
                templateDownloadHref={
                  selected ? `/crop-templates/${selected.key}` : undefined
                }
              />
            </div>
          ) : (
            <div className={`${CLASSNAME}-loading`}>
              {failed ? (
                <span>This file cannot be cropped. Upload it as it is.</span>
              ) : (
                <LoadingIndicator message="Reading image..." />
              )}
            </div>
          )}
        </div>

        {labellable && (
          <div className={`${CLASSNAME}-panels`}>
            <ImageLabelsClassification
              groups={groups}
              value={labels}
              onChange={setLabels}
            />
            <ImageLabelsMetadata value={labels} onChange={setLabels} />
          </div>
        )}
      </div>
    </div>
  );
});

export default CropStep;
