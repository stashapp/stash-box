import { type FC, useMemo, useState } from "react";
import { Button, Form } from "react-bootstrap";
import CropFrame, {
  CropFrameControls,
  type CropRect,
  cropPixels,
  FULL_FRAME,
  isIdentity,
  judgedCropSizeVerdict,
  largestCenteredRect,
  MAX_ZOOM,
} from "src/components/cropFrame";
import { Tooltip } from "src/components/fragments";
import {
  type ImageFragment,
  type ImageTypeEnum,
  type ImageTypeGroupsQuery,
  useRecropImage,
} from "src/graphql";
import { cropTemplateHref, errorMessage } from "src/utils";

import { claimedCropType } from "./types";

type ImageTypeGroup = ImageTypeGroupsQuery["imageTypeGroups"][number];

interface RecropEditorProps {
  image: ImageFragment;
  groups: ImageTypeGroup[];
  canAddAsNew: boolean;
  // True if the image is organized, which blocks recropping
  addAsNewOnly?: boolean;
  onClose: () => void;
  onRecropped: (image: ImageFragment, addAsNew: boolean) => void;
}

const CLASSNAME = "RecropEditor";

const RecropEditor: FC<RecropEditorProps> = ({
  image,
  groups,
  canAddAsNew,
  addAsNewOnly = false,
  onClose,
  onRecropped,
}) => {
  const [addAsNew, setAddAsNew] = useState(addAsNewOnly);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(MAX_ZOOM);

  // The template of the crop label this image carries, so a re-crop starts from the same guide
  const cropTypes = useMemo(
    () => groups.flatMap((group) => group.types).filter((t) => t.crop_template),
    [groups],
  );
  const [cropType, setCropType] = useState<ImageTypeEnum | undefined>(
    () => claimedCropType(groups, image.types)?.key,
  );
  const otherTypes = useMemo(
    () => image.types.filter((t) => !cropTypes.some((crop) => crop.key === t)),
    [image.types, cropTypes],
  );
  const byKey = useMemo(
    () =>
      new Map(
        groups.flatMap((group) => group.types).map((t) => [t.key, t] as const),
      ),
    [groups],
  );
  const chosen = cropType ? byKey.get(cropType) : undefined;
  // Labels the new framing rules out belong to the old one, so they go
  const dropped = otherTypes.filter(
    (t) =>
      chosen !== undefined &&
      (chosen.conflicts_with.includes(t) ||
        byKey.get(t)?.conflicts_with.includes(chosen.key)),
  );
  const types = [
    ...otherTypes.filter((t) => !dropped.includes(t)),
    ...(cropType ? [cropType] : []),
  ];
  const template = chosen?.crop_template;

  // Against the retained original when there is one: the server crops from it too, so the frame must be measured against it
  const displaySource = image.originalImage ?? image;

  const [rect, setRect] = useState<CropRect>(() =>
    template
      ? largestCenteredRect(
          template.aspect_ratio,
          displaySource.width / displaySource.height,
        )
      : FULL_FRAME,
  );

  const verdict = judgedCropSizeVerdict(
    cropPixels(rect, displaySource.width, displaySource.height),
    displaySource,
    types,
  );

  const chooseCropType = (key: ImageTypeEnum) => {
    setCropType(key);
    const next = cropTypes.find((t) => t.key === key)?.crop_template;
    setRect(
      next
        ? largestCenteredRect(
            next.aspect_ratio,
            displaySource.width / displaySource.height,
          )
        : FULL_FRAME,
    );
  };
  const [recropImage, { loading }] = useRecropImage();
  const [error, setError] = useState<string>();

  const save = () => {
    setError("");
    recropImage({
      variables: {
        imageData: {
          image_id: image.id,
          crop: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            angle: rect.angle,
          },
          types,
          date: image.date,
        },
      },
    })
      .then((result) => {
        if (result.data?.imageRecrop) {
          onRecropped(result.data.imageRecrop, addAsNew);
        }
      })
      .catch((e: unknown) => setError(errorMessage(e)));
  };

  return (
    <div className={CLASSNAME}>
      <CropFrame
        src={displaySource.url}
        naturalWidth={displaySource.width}
        naturalHeight={displaySource.height}
        aspectRatio={template?.aspect_ratio}
        guides={template?.guides}
        value={rect}
        onChange={setRect}
        fill
        zoom={zoom}
        onZoomChange={setZoom}
        onZoomCeilingChange={setMaxZoom}
      />
      <CropFrameControls
        src={displaySource.url}
        value={rect}
        onChange={setRect}
        aspectRatio={template?.aspect_ratio}
        naturalWidth={displaySource.width}
        naturalHeight={displaySource.height}
        guides={template?.guides}
        zoom={zoom}
        onZoomChange={setZoom}
        maxZoom={maxZoom}
        sizeVerdict={verdict}
        templateDownloadHref={
          template && chosen ? cropTemplateHref(chosen.key) : undefined
        }
      />
      {error && <div className="text-danger text-end mt-2">Error: {error}</div>}
      <div className="d-flex align-items-center gap-2 mt-2">
        <div className="me-auto d-flex align-items-center gap-3">
          {addAsNewOnly ? (
            <span className="text-muted">
              Organized, so the crop is added as a new image
            </span>
          ) : (
            canAddAsNew && (
              <Form.Check
                type="checkbox"
                id="recrop-add-as-new"
                label="Add as a new image"
                title="Keep this image as it is and add the crop alongside it, instead of replacing it"
                checked={addAsNew}
                onChange={(e) => setAddAsNew(e.target.checked)}
                disabled={loading}
              />
            )
          )}
          {addAsNew && cropTypes.length > 0 && (
            <Tooltip
              text={
                dropped.length > 0
                  ? `Without ${dropped
                      .map((t) => byKey.get(t)?.name ?? t)
                      .join(", ")}: not part of this crop`
                  : "The crop the new image is labelled with"
              }
              placement="top"
            >
              <span className="d-inline-block">
                <Form.Select
                  size="sm"
                  className="w-auto"
                  aria-label="Crop"
                  value={cropType ?? ""}
                  onChange={(e) =>
                    chooseCropType(e.target.value as ImageTypeEnum)
                  }
                  disabled={loading}
                >
                  {cropTypes.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.name}
                    </option>
                  ))}
                </Form.Select>
              </span>
            </Tooltip>
          )}
        </div>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={save} disabled={loading || isIdentity(rect)}>
          {loading
            ? "Cropping..."
            : addAsNew
              ? "Save as new image"
              : "Save crop"}
        </Button>
      </div>
    </div>
  );
};

export default RecropEditor;
