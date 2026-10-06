import { faImages } from "@fortawesome/free-solid-svg-icons";
import type { Lens } from "@hookform/lenses";
import cx from "classnames";
import { type ChangeEvent, type FC, useRef, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useFieldArray } from "react-hook-form";
import { Image as ImageInput } from "src/components/form";
import { Icon, LoadingIndicator } from "src/components/fragments";
import Modal from "src/components/modal";
import {
  type ImageTypeEnum,
  type ImageTypeScopeEnum,
  useAddImage,
  useImageTypeGroups,
  useSetImageOrganized,
  useUpdateImage,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { errorMessage } from "src/utils";

import ImageLabels from "./ImageLabels";
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

  const { isModerator } = useCurrentUser();
  const [imageData, setImageData] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [addImage] = useAddImage();
  const [updateImage] = useUpdateImage();
  const [setImageOrganized, { loading: organizing }] = useSetImageOrganized();
  const [error, setError] = useState<string>();

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

  // What the server has for each image, so leaving one with unapplied edits can be caught: nothing here saves itself
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
      .catch((e: unknown) => setError(errorMessage(e)))
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

  // Labels and date reach the server only on "Apply", in one imageUpdate
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

  const isDisabled = maxImages !== undefined && images.length >= maxImages;

  return (
    <>
      <Row className={`${CLASSNAME} w-100`}>
        <Col xs={7} className={CLASSNAME_IMAGES}>
          {images.map((i, index) => (
            <div className={CLASSNAME_IMAGE_ENTRY} key={i.image.id}>
              <ImageInput
                image={i.image}
                lightboxImages={images.map((image) => ({
                  ...image.image,
                  organized: isOrganized(image.image.id),
                }))}
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
                        const editable = canRecategorize(image.id);

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
          {error && <div className="text-danger text-end">Error: {error}</div>}
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
