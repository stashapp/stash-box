import { CombinedGraphQLErrors } from "@apollo/client";
import { type FC, useMemo, useState } from "react";
import { Button, Form } from "react-bootstrap";
import CropFrame, {
  CropFrameControls,
  type CropRect,
  FULL_FRAME,
  isIdentity,
  largestCenteredRect,
} from "src/components/cropFrame";
import {
  type ImageFragment,
  type ImageTypeEnum,
  type ImageTypeGroupsQuery,
  useRecropImage,
} from "src/graphql";

import LabelLockWarning from "./LabelLockWarning";

type ImageTypeGroup = ImageTypeGroupsQuery["imageTypeGroups"][number];

interface RecropEditorProps {
  image: ImageFragment;
  groups: ImageTypeGroup[];
  isModerator: boolean;
  typesCommitted: boolean;
  dateCommitted: boolean;
  canAddAsNew: boolean;
  onClose: () => void;
  onRecropped: (image: ImageFragment, addAsNew: boolean) => void;
}

const CLASSNAME = "RecropEditor";

/**
 * Re-crops an already-uploaded image, inline in the lightbox that opened it
 * rather than in a second modal stacked on top of it. Always produces a new
 * Image, which the caller swaps into the gallery in place of this one:
 * a stored image may in principle be shared by more than one entity via
 * checksum deduplication, so re-cropping never mutates it in place
 */
const RecropEditor: FC<RecropEditorProps> = ({
  image,
  groups,
  isModerator,
  typesCommitted,
  dateCommitted,
  canAddAsNew,
  onClose,
  onRecropped,
}) => {
  const [addAsNew, setAddAsNew] = useState(false);

  // The template matching whichever crop-group label this image already
  // carries, if any, so a re-crop defaults to the same guide it was labelled
  // with rather than starting from a bare frame
  const template = useMemo(() => {
    const templates = groups
      .flatMap((group) => group.types)
      .filter((t) => t.crop_template);
    return templates.find((t) => image.types.includes(t.key as ImageTypeEnum))
      ?.crop_template;
  }, [groups, image.types]);

  // Crop against the retained original when there is one: it's wider than
  // what's currently stored, and the server resolves the same original
  // independently when this crop is saved, so the frame the user drags here
  // must be measured against it too, not against the narrower current image
  const displaySource = image.originalImage ?? image;

  const [rect, setRect] = useState<CropRect>(() =>
    template
      ? largestCenteredRect(
          template.aspect_ratio,
          displaySource.width / displaySource.height,
        )
      : FULL_FRAME,
  );
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
          types: image.types,
          date: image.date,
        },
      },
    })
      .then((result) => {
        if (result.data?.imageRecrop) {
          onRecropped(result.data.imageRecrop, addAsNew);
        }
      })
      .catch((error: unknown) => {
        if (CombinedGraphQLErrors.is(error)) setError(error.message);
      });
  };

  const targetTypesCommitted = !addAsNew && typesCommitted;
  const targetDateCommitted = !addAsNew && dateCommitted;
  const willLockTypes =
    !isModerator && !targetTypesCommitted && image.types.length > 0;
  const willLockDate = !isModerator && !targetDateCommitted && !!image.date;
  const [confirming, setConfirming] = useState(false);
  const requestSave = () => {
    if (willLockTypes || willLockDate) {
      setConfirming(true);
    } else {
      save();
    }
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
        hideControls
      />
      <CropFrameControls
        src={displaySource.url}
        value={rect}
        onChange={setRect}
        aspectRatio={template?.aspect_ratio}
        naturalWidth={displaySource.width}
        naturalHeight={displaySource.height}
        guides={template?.guides}
      />
      {error && <div className="text-danger text-end mt-2">{error}</div>}
      <div className={`${CLASSNAME}-actions`}>
        {canAddAsNew && (
          <Form.Check
            className="me-auto"
            type="checkbox"
            id="recrop-add-as-new"
            label="Add as a new image"
            title="Keep this image as it is and add the crop alongside it, instead of replacing it"
            checked={addAsNew}
            onChange={(e) => setAddAsNew(e.target.checked)}
            disabled={loading}
          />
        )}
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={requestSave} disabled={loading || isIdentity(rect)}>
          {loading
            ? "Cropping..."
            : addAsNew
              ? "Save as new image"
              : "Save crop"}
        </Button>
      </div>
      <LabelLockWarning
        show={confirming}
        action="crop"
        willLockTypes={willLockTypes}
        willLockDate={willLockDate}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          save();
        }}
      />
    </div>
  );
};

export default RecropEditor;
