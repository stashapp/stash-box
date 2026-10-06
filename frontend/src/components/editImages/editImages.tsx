import { faImages } from "@fortawesome/free-solid-svg-icons";
import type { Lens } from "@hookform/lenses";
import { type ChangeEvent, type FC, useRef, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useFieldArray } from "react-hook-form";
import { judgedCropSizeVerdict } from "src/components/cropFrame";
import { Image as ImageInput } from "src/components/form";
import { Icon } from "src/components/fragments";
import Modal from "src/components/modal";
import {
  type ImageCropInput,
  type ImageFragment,
  type ImageTypeEnum,
  type ImageTypeScopeEnum,
  useAddImage,
  useImageTypeGroups,
  useSetImageOrganized,
  useUpdateImage,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { errorMessage, maxImageDate, partialDateError } from "src/utils";

import CropStep, { type CropStepHandle } from "./CropStep";
import ImageLabels from "./ImageLabels";
import RecropEditor from "./RecropEditor";
import { claimedCropType, type TypedImage } from "./types";

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

  const labellable = groups.some((group) => group.types.length > 0);

  const typeName = (key: string) =>
    groups.flatMap((group) => group.types).find((type) => type.key === key)
      ?.name ?? key;

  const hasTemplates = groups.some((group) =>
    group.types.some((type) => type.crop_template),
  );
  const cropTemplates = Object.fromEntries(
    images.flatMap((i) => {
      const claimed = claimedCropType(groups, i.types)?.crop_template;
      return claimed
        ? [
            [
              i.image.id,
              {
                aspectRatio: claimed.aspect_ratio,
                guides: claimed.guides,
              },
            ] as const,
          ]
        : [];
    }),
  );

  const { isModerator } = useCurrentUser();
  const [uploading, setUploading] = useState(false);
  const [addImage] = useAddImage();
  const [updateImage] = useUpdateImage();
  const [setImageOrganized, { loading: organizing }] = useSetImageOrganized();
  const [recropTarget, setRecropTarget] = useState<ImageFragment>();
  const [error, setError] = useState<string>();
  // Whether the pending upload is a crop: Upload then reads "Crop and upload" and offers Reset
  const [crops, setCrops] = useState(false);
  // The server checks the date's format, not its range,
  // so Upload is disabled on an out-of-range date the same way Apply is
  const [uploadDateValid, setUploadDateValid] = useState(true);
  const cropStep = useRef<CropStepHandle>(null);

  // Organized is read from the form's opening snapshot plus this session's
  // own toggle flips; a fresh upload has no snapshot entry and is editable
  const originalByID = new Map(
    (original ?? []).map((entry) => [entry.image.id, entry]),
  );
  const [organizedByID, setOrganizedByID] = useState<Record<string, boolean>>(
    {},
  );
  const isOrganized = (imageId: string) =>
    organizedByID[imageId] ??
    originalByID.get(imageId)?.image.organized ??
    false;
  const canRecategorize = (imageId: string) => !isOrganized(imageId);

  const labels = Object.fromEntries(
    images
      .filter((i) => i.types.length > 0 || i.date)
      .map((i) => [
        i.image.id,
        [...i.types.map(typeName), ...(i.date ? [i.date] : [])],
      ]),
  );
  const toggleOrganized = async (imageId: string) => {
    const organized = !isOrganized(imageId);
    if (organized && hasUnsavedChanges(imageId)) {
      const current = images.find((image) => image.image.id === imageId);
      if (!current) return;
      const { key: _key, ...value } = current;
      if (!(await applyLabels(imageId, value))) return;
    }
    setError("");
    setImageOrganized({
      variables: {
        input: { id: imageId, organized },
      },
    })
      .then((result) => {
        const organized = result.data?.imageSetOrganized?.organized;
        if (organized !== undefined)
          setOrganizedByID((prev) => ({ ...prev, [imageId]: organized }));
      })
      .catch((e: unknown) => setError(errorMessage(e)));
  };

  // What the server has for each image, so leaving one with unapplied edits can be caught: nothing here saves itself.
  // Moves forward at each point that reaches the server: a labelled upload, a recrop, a successful Apply
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
  const [pendingLeave, setPendingLeave] = useState<{
    imageId: string;
    proceed: () => void;
  }>();
  const confirmLeave = (imageId: string, proceed: () => void) => {
    if (!hasUnsavedChanges(imageId)) proceed();
    else setPendingLeave({ imageId, proceed });
  };
  const resolveLeave = (leave: boolean) => {
    const pending = pendingLeave;
    setPendingLeave(undefined);
    if (!leave || !pending) return;
    const position = images.findIndex(
      (image) => image.image.id === pending.imageId,
    );
    if (position >= 0) {
      const saved = savedByID.current.get(pending.imageId) ?? {
        types: [],
        date: null,
      };
      const { key: _key, ...entry } = images[position];
      update(position, { ...entry, types: saved.types, date: saved.date });
    }
    pending.proceed();
  };

  // Crop and label are chosen in one action and land in one imageCreate
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
      .catch((e: unknown) => setError(errorMessage(e)))
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
    return updateImage({
      variables: {
        imageData: { id: imageId, types: value.types, date: value.date },
      },
    })
      .then(() => {
        savedByID.current.set(imageId, {
          types: value.types,
          date: value.date,
        });
        return true;
      })
      .catch((e: unknown) => {
        setError(errorMessage(e));
        return false;
      })
      .finally(() => {
        setApplyingId(undefined);
      });
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
      // The pending labels rode across onto the new row, so the source row
      // returns to its saved state: leaving them would trip the unsaved-changes
      // warning over work that has in fact been applied
      const source = images[position];
      const saved = savedByID.current.get(source.image.id) ?? {
        types: [],
        date: null,
      };
      update(position, {
        image: source.image,
        types: saved.types,
        date: saved.date ?? null,
      });
    } else {
      update(position, entry);
    }
    // Recrop always lands on a new row, carrying the source's labels and
    // date across atomically, tracked under the new id since that is what the gallery now holds
    savedByID.current.set(newImage.id, {
      types: newImage.types,
      date: newImage.date,
    });
    setRecropTarget(undefined);
  };

  const isDisabled = maxImages !== undefined && images.length >= maxImages;
  const roomForAnother = maxImages === undefined || images.length < maxImages;

  // An organized image keeps its verified framing: a re-crop of it can only
  // be added alongside, so without room for another image there is nothing to offer
  const canRecrop = (imageId: string) =>
    cropTemplates[imageId] !== undefined &&
    (canRecategorize(imageId) || roomForAnother);

  // Only true for images that can have labels and crop controls
  const wantsRoom = file !== undefined && hasTemplates;

  // Guarded again although every entrypoint is hidden when it is false
  const openRecrop = (imageId: string) => {
    if (!canRecrop(imageId)) return;
    const entry = images.find((image) => image.image.id === imageId);
    if (!entry) return;
    setError("");
    setRecropTarget({
      ...entry.image,
      types: entry.types,
      date: entry.date,
    });
  };

  // One row for everything acting on the pending upload, rendered under the
  // picture while there is one and under the drop zone otherwise
  const actions = (
    <>
      {error && <div className="text-danger text-end">Error: {error}</div>}
      <div className="mt-4 d-flex">
        {file && (
          <>
            <Button variant="danger" onClick={removeImage} disabled={uploading}>
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
    </>
  );

  return (
    <>
      <Row className={`${CLASSNAME} w-100`}>
        <Col xs={wantsRoom ? 4 : 7} className={CLASSNAME_IMAGES}>
          {images.map((i, index) => (
            <div className={CLASSNAME_IMAGE_ENTRY} key={i.image.id}>
              <ImageInput
                image={i.image}
                sizeVerdict={judgedCropSizeVerdict(
                  i.image,
                  i.image.originalImage ?? undefined,
                  i.types,
                )}
                lightboxImages={images.map((image) => ({
                  ...image.image,
                  organized: isOrganized(image.image.id),
                }))}
                onRemove={() => remove(index)}
                lightboxProps={{
                  labels,
                  cropTemplates,
                  confirmLeave,
                  onRecrop: (image) => openRecrop(image.id),
                  canRecrop,
                  renderCropEditor: (image) =>
                    recropTarget?.id === image.id ? (
                      <RecropEditor
                        image={recropTarget}
                        groups={groups}
                        canAddAsNew={roomForAnother}
                        addAsNewOnly={isOrganized(recropTarget.id)}
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
                        const editable = canRecategorize(image.id);
                        // The server only checks the date's format, not its
                        // range, so Apply has to be the thing stopping an
                        // out-of-range date from reaching it.
                        const dateError = partialDateError(
                          current.date,
                          maxImageDate(),
                        );

                        return (
                          <div>
                            <ImageLabels
                              groups={groups}
                              value={current}
                              labelsDisabled={!editable}
                              dateDisabled={!editable}
                              onChange={(value) => update(position, value)}
                            />
                            {editable && (
                              <Button
                                className="mt-2"
                                disabled={
                                  applyingId === image.id ||
                                  !!dateError ||
                                  !hasUnsavedChanges(image.id)
                                }
                                onClick={() => applyLabels(image.id, current)}
                              >
                                {applyingId === image.id
                                  ? "Applying..."
                                  : "Apply"}
                              </Button>
                            )}
                            {isModerator && (
                              <Form.Check
                                type="switch"
                                id={`organized-${image.id}`}
                                className="mt-2"
                                label="Organized"
                                title="Applies any pending labels, then locks the labels, date and gallery placement for everyone until the mark is withdrawn"
                                checked={isOrganized(image.id)}
                                disabled={organizing}
                                onChange={() => toggleOrganized(image.id)}
                              />
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
                actions={actions}
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
          {!file && actions}
        </Col>
      </Row>
      {pendingLeave && (
        <Modal
          message="This image has labels or a date that have not been applied yet. Leave without applying them?"
          acceptTerm="Leave"
          cancelTerm="Stay"
          callback={resolveLeave}
        />
      )}
    </>
  );
};

export default EditImages;
