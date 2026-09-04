import { CombinedGraphQLErrors } from "@apollo/client";
import { faImages } from "@fortawesome/free-solid-svg-icons";
import type { Lens } from "@hookform/lenses";
import cx from "classnames";
import { type ChangeEvent, type FC, useRef, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useFieldArray } from "react-hook-form";
import { Image as ImageInput } from "src/components/form";
import { Icon, LoadingIndicator } from "src/components/fragments";
import {
  type ImageTypeEnum,
  type ImageTypeScopeEnum,
  useAddImage,
  useImageTypeGroups,
  useUpdateImage,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";

import ImageLabels from "./ImageLabels";
import LabelLockWarning from "./LabelLockWarning";
import type { TypedImage } from "./types";

const CLASSNAME = "EditImages";
const CLASSNAME_IMAGES = `${CLASSNAME}-images`;
const CLASSNAME_INPUT = `${CLASSNAME}-input`;
const CLASSNAME_INPUT_CONTAINER = `${CLASSNAME_INPUT}-container`;
const CLASSNAME_DROP = `${CLASSNAME}-drop`;
const CLASSNAME_PLACEHOLDER = `${CLASSNAME}-placeholder`;
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_UPLOADING = `${CLASSNAME_IMAGE}-uploading`;
const CLASSNAME_IMAGE_ENTRY = `${CLASSNAME}-image-entry`;

interface EditImagesProps {
  lens: Lens<TypedImage[]>;
  file: File | undefined;
  setFile: (f: File | undefined) => void;
  maxImages?: number;
  /** Whether to allow svg/png image input */
  allowLossless?: boolean;
  original?: TypedImage[] | undefined;
  /**
   * Which entity kind these images belong to. Types that entity cannot carry
   * are filtered out, so scenes and studios show no label controls until their
   * taxonomies ship.
   */
  target: ImageTypeScopeEnum;
}

const EditImages: FC<EditImagesProps> = ({
  lens,
  maxImages,
  file,
  setFile,
  allowLossless = false,
  original,
  target,
}) => {
  const interop = lens.interop();
  const {
    fields: images,
    append,
    remove,
    replace,
    update,
  } = useFieldArray({
    control: interop.control,
    name: interop.name,
    keyName: "key",
  });

  const { data: vocabulary } = useImageTypeGroups({
    target,
    // We need to include disabled labels so they can be seen and removed
    includeDisabled: true,
  });
  const groups = vocabulary?.imageTypeGroups ?? [];

  // This decides whether or not we offer the labeling controls
  const labellable = groups.some((group) => group.types.length > 0);

  const typeName = (key: string) =>
    groups.flatMap((group) => group.types).find((type) => type.key === key)
      ?.name ?? key;

  const labels = Object.fromEntries(
    images
      .filter((i) => i.types.length > 0 || i.date)
      .map((i) => [
        i.image.id,
        [...i.types.map(typeName), ...(i.date ? [i.date] : [])],
      ]),
  );

  const { isModerator } = useCurrentUser();
  const [imageData, setImageData] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [addImage] = useAddImage();
  const [updateImage] = useUpdateImage();
  const [error, setError] = useState<string>();

  // Whether this session may set this image's labels/date: checked against
  // the state the image was in when this form opened, not against anything
  // changed since. An EDIT-role session that categorizes a previously-blank
  // image keeps working with it for the rest of this sitting -- it is still
  // the same single editing action, just one this control happens to save
  // in steps. MODERATE only starts being required the next time the form is
  // opened against server state that now shows it categorized.
  //
  // Types and date are gated independently: an image someone labelled
  // earlier can still take a first EDIT-role date, and vice versa. Each
  // check looks at its own field's baseline, plus whatever this session has
  // itself already saved for that field -- a successful Apply sets the
  // field server-side just as surely as a previous session would have, so a
  // second Apply changing it again really is a second, MODERATE-gated edit,
  // not a continuation of the first.
  const originalByID = new Map(
    (original ?? []).map((entry) => [entry.image.id, entry]),
  );
  const typesCommitted = useRef(new Set<string>());
  const dateCommitted = useRef(new Set<string>());
  const typesEditable = (imageId: string) => {
    if (isModerator) return true;
    if (typesCommitted.current.has(imageId)) return false;
    return (originalByID.get(imageId)?.types.length ?? 0) === 0;
  };
  const dateEditable = (imageId: string) => {
    if (isModerator) return true;
    if (dateCommitted.current.has(imageId)) return false;
    return !originalByID.get(imageId)?.date;
  };

  // Whether a save is *this* session's own first commit of a field, for a
  // non-moderator -- the moment it stops being editable afterward, which is
  // exactly when the lock is worth warning about before it happens.
  const willLockTypes = (imageId: string, types: ImageTypeEnum[]) =>
    !isModerator && typesEditable(imageId) && types.length > 0;
  const willLockDate = (imageId: string, date: string | null | undefined) =>
    !isModerator && dateEditable(imageId) && !!date;

  // What the server actually has for each image, so navigating away from one
  // with local edits not yet applied can be caught before they are silently
  // lost -- nothing here saves itself, so switching images used to be
  // indistinguishable from discarding whatever was just typed.
  const savedByID = useRef(
    new Map<
      string,
      { types: ImageTypeEnum[]; date: string | null | undefined }
    >(
      (original ?? []).map((entry) => [
        entry.image.id,
        { types: entry.types, date: entry.date },
      ]),
    ),
  );
  const hasUnsavedChanges = (imageId: string) => {
    const current = images.find((image) => image.image.id === imageId);
    if (!current) return false;
    const saved = savedByID.current.get(imageId) ?? { types: [], date: null };
    return (
      current.types.length !== saved.types.length ||
      current.types.some((type) => !saved.types.includes(type)) ||
      (current.date ?? null) !== (saved.date ?? null)
    );
  };
  const confirmLeave = (imageId: string) =>
    !hasUnsavedChanges(imageId) ||
    window.confirm(
      "This image has labels or a date that have not been applied yet. Leave without applying them?",
    );

  const handleAddImage = () => {
    setError("");
    setUploading(true);
    addImage({
      variables: {
        imageData: { file },
      },
    })
      .then((i) => {
        if (i.data?.imageCreate?.id) {
          if (
            !images.some((image) => image.image.id === i.data?.imageCreate?.id)
          ) {
            append({
              image: i.data.imageCreate,
              types: [],
              date: null,
            });
          }
          setFile(undefined);
          setImageData("");
        }
      })
      .catch((error: unknown) => {
        if (CombinedGraphQLErrors.is(error)) setError(error.message);
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const removeImage = () => {
    setFile(undefined);
    setError("");
    setImageData("");
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.validity.valid && event.target.files?.[0]) {
      setFile(event.target.files[0]);

      const reader = new FileReader();
      reader.onload = (e) =>
        e.target?.result && setImageData(e.target.result as string);
      reader.onerror = () => setImageData("");
      reader.onabort = () => setImageData("");
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  // Nothing here saves on its own: labels and date are edited freely in
  // local form state, and only reach the server once "Apply" is clicked --
  // one imageUpdate call carrying everything changed in this sitting.
  const [applyingId, setApplyingId] = useState<string>();
  const applyLabels = (imageId: string, value: TypedImage) => {
    setApplyingId(imageId);
    setError("");
    updateImage({
      variables: {
        imageData: { id: imageId, types: value.types, date: value.date },
      },
    })
      .then(() => {
        // Only the fields this save actually set: a save that only touched
        // the date must not also lock the label controls, and vice versa.
        if (value.types.length > 0) typesCommitted.current.add(imageId);
        if (value.date) dateCommitted.current.add(imageId);
        savedByID.current.set(imageId, {
          types: value.types,
          date: value.date,
        });
      })
      .catch((error: unknown) => {
        if (CombinedGraphQLErrors.is(error)) setError(error.message);
      })
      .finally(() => {
        setApplyingId(undefined);
      });
  };

  // Confirmed once, right before a field that's still editable this
  // session would lock for good -- skipped for a moderator, and for a save
  // that only restates fields already locked, since neither actually loses
  // anything by proceeding.
  const [pendingApply, setPendingApply] = useState<{
    imageId: string;
    value: TypedImage;
  }>();
  const requestApply = (imageId: string, value: TypedImage) => {
    if (
      willLockTypes(imageId, value.types) ||
      willLockDate(imageId, value.date)
    ) {
      setPendingApply({ imageId, value });
    } else {
      applyLabels(imageId, value);
    }
  };

  const isDisabled = maxImages !== undefined && images.length >= maxImages;

  return (
    <>
      <Row className={`${CLASSNAME} w-100`}>
        <Col xs={7} className={CLASSNAME_IMAGES}>
          {images.map((i, index) => (
            <div className={CLASSNAME_IMAGE_ENTRY} key={i.image.id}>
              <ImageInput
                image={i.image}
                lightboxImages={images.map((image) => image.image)}
                onRemove={() => remove(index)}
                labels={labels}
                confirmLeave={confirmLeave}
                renderEditor={
                  labellable
                    ? (image) => {
                        const position = images.findIndex(
                          (candidate) => candidate.image.id === image.id,
                        );
                        if (position < 0) return null;

                        // Drop the key, it does not need to be propagated
                        const { key: _key, ...current } = images[position];
                        const labelsOk = typesEditable(image.id);
                        const dateOk = dateEditable(image.id);

                        return (
                          <div className={`${CLASSNAME}-label-editor`}>
                            <ImageLabels
                              groups={groups}
                              value={current}
                              labelsDisabled={!labelsOk}
                              dateDisabled={!dateOk}
                              onChange={(value) => update(position, value)}
                            />
                            {(labelsOk || dateOk) && (
                              <Button
                                size="sm"
                                className="mt-2"
                                disabled={
                                  applyingId === image.id ||
                                  !hasUnsavedChanges(image.id)
                                }
                                onClick={() => requestApply(image.id, current)}
                              >
                                {applyingId === image.id
                                  ? "Applying..."
                                  : "Apply"}
                              </Button>
                            )}
                          </div>
                        );
                      }
                    : undefined
                }
              />
            </div>
          ))}
        </Col>
        <Col xs={5} className={CLASSNAME_INPUT}>
          <div className={CLASSNAME_INPUT_CONTAINER}>
            {file ? (
              <div
                className={cx(CLASSNAME_IMAGE, {
                  [CLASSNAME_UPLOADING]: uploading,
                })}
              >
                <img src={imageData} alt="" />
                <LoadingIndicator message="Uploading image..." />
              </div>
            ) : (
              !isDisabled && (
                <div className={CLASSNAME_DROP}>
                  <Form.Control
                    type="file"
                    onChange={onFileChange}
                    accept={[
                      ".jpg",
                      ".jpeg",
                      ".webp",
                      ".jfif",
                      ...(allowLossless ? [".svg", ".png"] : []),
                    ].join(",")}
                  />
                  <div className={CLASSNAME_PLACEHOLDER}>
                    <Icon icon={faImages} />
                    <span>Add image</span>
                  </div>
                </div>
              )
            )}
          </div>
          <Row className="text-end text-danger">
            <div>{error}</div>
          </Row>
          <div className="mt-4 d-flex">
            {file && (
              <>
                <Button
                  variant="danger"
                  onClick={() => removeImage()}
                  disabled={!file || uploading}
                >
                  Remove
                </Button>
                <Button
                  onClick={() => handleAddImage()}
                  disabled={!file || uploading}
                  className="ms-2"
                >
                  Upload
                </Button>
              </>
            )}
            <Button
              variant="danger"
              onClick={() => original && replace(original)}
              disabled={original === undefined}
              className="ms-auto mt-auto"
            >
              Reset Images
            </Button>
          </div>
        </Col>
      </Row>
      <LabelLockWarning
        show={pendingApply !== undefined}
        willLockTypes={
          pendingApply !== undefined &&
          willLockTypes(pendingApply.imageId, pendingApply.value.types)
        }
        willLockDate={
          pendingApply !== undefined &&
          willLockDate(pendingApply.imageId, pendingApply.value.date)
        }
        onCancel={() => setPendingApply(undefined)}
        onConfirm={() => {
          if (pendingApply)
            applyLabels(pendingApply.imageId, pendingApply.value);
          setPendingApply(undefined);
        }}
      />
    </>
  );
};

export default EditImages;
