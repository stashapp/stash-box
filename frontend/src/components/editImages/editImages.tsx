import { CombinedGraphQLErrors } from "@apollo/client";
import { faImages } from "@fortawesome/free-solid-svg-icons";
import type { Lens } from "@hookform/lenses";
import cx from "classnames";
import { type ChangeEvent, type FC, useRef, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useFieldArray } from "react-hook-form";
import { Image as ImageInput } from "src/components/form";
import { Icon } from "src/components/fragments";
import {
  type ImageCropInput,
  type ImageFragment,
  type ImageTypeEnum,
  type ImageTypeScopeEnum,
  useAddImage,
  useImageTypeGroups,
  useUpdateImage,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { maxImageDate, partialDateError } from "src/utils";

import CropStep, { type CropStepHandle } from "./CropStep";
import ImageLabels from "./ImageLabels";
import LabelLockWarning from "./LabelLockWarning";
import RecropEditor from "./RecropEditor";
import type { TypedImage } from "./types";

const CLASSNAME = "EditImages";
const CLASSNAME_IMAGES = `${CLASSNAME}-images`;
const CLASSNAME_INPUT = `${CLASSNAME}-input`;
const CLASSNAME_INPUT_CONTAINER = `${CLASSNAME_INPUT}-container`;
const CLASSNAME_DROP = `${CLASSNAME}-drop`;
const CLASSNAME_PLACEHOLDER = `${CLASSNAME}-placeholder`;
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

  const templates = new Map(
    groups
      .flatMap((group) => group.types)
      .flatMap((type) =>
        type.crop_template
          ? [
              [
                type.key,
                {
                  aspectRatio: type.crop_template.aspect_ratio,
                  guides: type.crop_template.guides,
                },
              ] as const,
            ]
          : [],
      ),
  );
  const cropTemplates = Object.fromEntries(
    images.flatMap((i) => {
      const claimed = i.types.map((t) => templates.get(t)).find(Boolean);
      return claimed ? [[i.image.id, claimed] as const] : [];
    }),
  );

  const { isModerator } = useCurrentUser();
  const [uploading, setUploading] = useState(false);
  const [addImage] = useAddImage();
  const [updateImage] = useUpdateImage();
  const [recropTarget, setRecropTarget] = useState<ImageFragment>();
  const [error, setError] = useState<string>();
  // Whether the pending upload is a crop, so the Upload button below
  // can call itself "Crop and upload" and offer Reset
  const [crops, setCrops] = useState(false);
  // Whether the pending upload's date is within range, so Upload can be
  // disabled the same way Apply is below -- the server only checks the
  // date's format, not its range, so nothing else stops an out-of-range date
  // from being persisted once the field is flagging it as invalid.
  const [uploadDateValid, setUploadDateValid] = useState(true);
  const cropStep = useRef<CropStepHandle>(null);

  // Whether this session may set this image's labels/date/crop: checked
  // against the state the image was in when this form opened, not against
  // anything changed since. An EDIT-role session that categorizes a
  // previously-blank image keeps working with it for the rest of this
  // sitting: it is still the same single editing action, just one this
  // control happens to save in steps. MODERATE only starts being required
  // the next time the form is opened against server state that now shows it
  // categorized
  //
  // Types and date are gated independently: an image someone labelled
  // earlier can still take a first EDIT-role date, and vice versa. Each
  // check looks at its own field's baseline, plus whatever this session has
  // itself already saved for that field -- a successful Apply sets the
  // field server-side just as surely as a previous session would have, so a
  // second Apply changing it again really is a second, MODERATE-gated
  // edit, not a continuation of the first. Without tracking this the
  // controls would stay interactive after the field they touch is already
  // committed, and a second Apply would silently fail server-side
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
  // Recrop touches the stored pixels wholesale rather than one field at a
  // time, so there is no equivalent of re-cropping "just the labels":
  // it is gated on whichever of types/date the image already has
  const canRecategorize = (imageId: string) =>
    typesEditable(imageId) && dateEditable(imageId);

  // Whether a save is *this* session's own first commit of a field, for a
  // non-moderator -- the moment it stops being editable afterward, which is
  // exactly when the lock is worth warning about before it happens.
  const willLockTypes = (imageId: string, types: ImageTypeEnum[]) =>
    !isModerator && typesEditable(imageId) && types.length > 0;
  const willLockDate = (imageId: string, date: string | null | undefined) =>
    !isModerator && dateEditable(imageId) && !!date;

  // What the server actually has for each image, so navigating away from
  // one with local edits not yet applied can be caught before they are
  // silently lost: nothing here saves itself, so leaving would otherwise
  // be indistinguishable from discarding whatever was just typed. Starts
  // from the form's baseline and moves forward at each of the three points
  // that actually reach the server: a labelled upload, a recrop (which
  // carries the source's labels across atomically), and a successful Apply
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

  // The crop and the label are chosen in one action, so the type arrives here
  // already true of the image rather than as something to judge afterwards -
  // and both land in the same imageCreate call, so upload+label stays one
  // action from the server's point of view too
  const handleAddImage = (
    crop: ImageCropInput | undefined,
    types: ImageTypeEnum[],
    imageDate: string | null,
  ) => {
    setError("");
    setUploading(true);
    addImage({
      variables: {
        imageData: { file, crop, types, date: imageDate },
      },
    })
      .then((i) => {
        const created = i.data?.imageCreate;
        if (created) {
          if (!images.some((image) => image.image.id === created.id)) {
            // Read the response's own types/date rather than the submitted
            // ones: a checksum dedup hit returns an existing, already
            // categorized image whose labels this upload did not set
            append({
              image: created,
              types: created.types,
              date: created.date,
            });
            savedByID.current.set(created.id, {
              types: created.types,
              date: created.date,
            });
          }
          setFile(undefined);
          setCrops(false);
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
    setCrops(false);
    setError("");
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.validity.valid && event.target.files?.[0]) {
      setFile(event.target.files[0]);
      setError("");
    }
  };

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

  const handleRecropped = (
    position: number,
    newImage: ImageFragment,
    addAsNew: boolean,
  ) => {
    const entry = {
      image: newImage,
      types: newImage.types,
      date: newImage.date,
    };
    if (addAsNew) {
      append(entry);
    } else {
      update(position, entry);
    }
    // Recrop always lands on a new row, carrying the source's labels and
    // date across atomically, tracked under the new id since that is
    // what the gallery now holds. Committed the same as a successful Apply
    // would: the server now has these fields set on this row too, so an
    // EDIT-role session touching either again would be rejected exactly
    // like a second Apply already is
    if (newImage.types.length > 0) typesCommitted.current.add(newImage.id);
    if (newImage.date) dateCommitted.current.add(newImage.id);
    savedByID.current.set(newImage.id, {
      types: newImage.types,
      date: newImage.date,
    });
    setRecropTarget(undefined);
  };

  const isDisabled = maxImages !== undefined && images.length >= maxImages;

  // Only true for images that can have labels and crop controls
  const wantsRoom = file !== undefined && templates.size > 0;

  // Guarded a second time here even though every entrypoint that calls this
  // is itself hidden when canRecategorize is false: defence in depth costs
  // nothing and the server enforces the same rule regardless
  const openRecrop = (imageId: string) => {
    if (!canRecategorize(imageId)) return;
    const target = images.find((image) => image.image.id === imageId);
    if (!target) return;
    setError("");
    setRecropTarget({
      ...target.image,
      types: target.types,
      date: target.date,
    });
  };

  return (
    <>
      <Row className={`${CLASSNAME} w-100`}>
        <Col xs={wantsRoom ? 4 : 7} className={CLASSNAME_IMAGES}>
          {images.map((i, index) => (
            <div className={CLASSNAME_IMAGE_ENTRY} key={i.image.id}>
              <ImageInput
                image={i.image}
                lightboxImages={images.map((image) => image.image)}
                onRemove={() => remove(index)}
                lightboxProps={{
                  labels,
                  cropTemplates,
                  confirmLeave,
                  onRecrop: (image) => openRecrop(image.id),
                  canRecrop: (imageId) =>
                    canRecategorize(imageId) &&
                    cropTemplates[imageId] !== undefined,
                  renderCropEditor: (image) =>
                    recropTarget?.id === image.id ? (
                      <RecropEditor
                        image={recropTarget}
                        groups={groups}
                        isModerator={isModerator}
                        typesCommitted={typesCommitted.current.has(
                          recropTarget.id,
                        )}
                        dateCommitted={dateCommitted.current.has(
                          recropTarget.id,
                        )}
                        canAddAsNew={
                          maxImages === undefined || images.length < maxImages
                        }
                        onClose={() => setRecropTarget(undefined)}
                        onRecropped={(newImage, addAsNew) => {
                          const position = images.findIndex(
                            (candidate) =>
                              candidate.image.id === recropTarget.id,
                          );
                          if (position >= 0)
                            handleRecropped(position, newImage, addAsNew);
                        }}
                      />
                    ) : undefined,
                  renderEditor: labellable
                    ? (image) => {
                        const position = images.findIndex(
                          (candidate) => candidate.image.id === image.id,
                        );
                        if (position < 0) return null;

                        // Drop the key, it does not need to be propagated
                        const { key: _key, ...current } = images[position];
                        const labelsOk = typesEditable(image.id);
                        const dateOk = dateEditable(image.id);
                        // The server only checks the date's format, not its
                        // range, so Apply has to be the thing stopping an
                        // out-of-range date from reaching it.
                        const dateError = partialDateError(
                          current.date,
                          maxImageDate(),
                        );

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
                                  !!dateError ||
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
                    : undefined,
                }}
              />
            </div>
          ))}
        </Col>
        <Col xs={wantsRoom ? 8 : 5} className={CLASSNAME_INPUT}>
          <div className={CLASSNAME_INPUT_CONTAINER}>
            {file ? (
              <CropStep
                ref={cropStep}
                file={file}
                groups={groups}
                onCropsChange={setCrops}
                onDateValidChange={setUploadDateValid}
                onUpload={handleAddImage}
              />
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
          {error && <div className="text-danger text-end">{error}</div>}
          <div
            className={cx("mt-4 d-flex", {
              [`${CLASSNAME}-actions-roomy`]: wantsRoom,
            })}
          >
            {file && (
              <>
                <Button
                  variant="danger"
                  onClick={removeImage}
                  disabled={uploading}
                >
                  Remove
                </Button>

                {crops && (
                  <Button
                    variant="secondary"
                    onClick={() => cropStep.current?.reset()}
                    disabled={uploading}
                    className="ms-2"
                  >
                    Reset
                  </Button>
                )}

                <Button
                  onClick={() => cropStep.current?.upload()}
                  disabled={uploading || !uploadDateValid}
                  className="ms-2"
                >
                  {uploading
                    ? "Uploading..."
                    : crops
                      ? "Crop and upload"
                      : "Upload"}
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
        action="apply"
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
