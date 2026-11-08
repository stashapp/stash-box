import { faImages } from "@fortawesome/free-solid-svg-icons";
import type { Lens } from "@hookform/lenses";
import { type ChangeEvent, type FC, useRef, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useFieldArray } from "react-hook-form";
import { judgedCropSizeVerdict } from "src/components/cropFrame";
import { Image as ImageInput } from "src/components/form";
import { Icon } from "src/components/fragments";
import {
  type ImageFragment as Image,
  type ImageCropInput,
  type ImageTypeEnum,
  type ImageTypeScopeEnum,
  useAddImage,
  useImageTypeGroups,
} from "src/graphql";
import { errorMessage } from "src/utils";

import CropStep, { type CropStepHandle } from "./CropStep";
import RecropEditor from "./RecropEditor";
import { claimedCropType } from "./types";

const CLASSNAME = "EditImages";
const CLASSNAME_IMAGES = `${CLASSNAME}-images`;
const CLASSNAME_INPUT = `${CLASSNAME}-input`;
const CLASSNAME_INPUT_CONTAINER = `${CLASSNAME_INPUT}-container`;
const CLASSNAME_DROP = `${CLASSNAME}-drop`;
const CLASSNAME_PLACEHOLDER = `${CLASSNAME}-placeholder`;
const CLASSNAME_IMAGE_ENTRY = `${CLASSNAME}-image-entry`;

interface EditImagesProps {
  lens: Lens<Image[]>;
  file: File | undefined;
  setFile: (f: File | undefined) => void;
  maxImages?: number;
  /** Whether to allow svg/png image input */
  allowLossless?: boolean;
  original?: Image[] | undefined;
  showCategorization?: boolean;
  target?: ImageTypeScopeEnum;
}

const EditImages: FC<EditImagesProps> = ({
  lens,
  maxImages,
  file,
  setFile,
  allowLossless = false,
  original,
  showCategorization = false,
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

  const { data: vocabulary } = useImageTypeGroups(
    {
      target,
      // We need to include disabled labels so they can be seen and removed
      includeDisabled: true,
    },
    target === undefined,
  );
  const groups = vocabulary?.imageTypeGroups ?? [];

  const hasTemplates = groups.some((group) =>
    group.types.some((type) => type.crop_template),
  );
  const templateFor = (types: readonly string[]) => {
    const claimed = claimedCropType(groups, types)?.crop_template;
    return claimed
      ? { aspectRatio: claimed.aspect_ratio, guides: claimed.guides }
      : undefined;
  };

  const [uploading, setUploading] = useState(false);
  const [addImage] = useAddImage();
  const [recropTarget, setRecropTarget] = useState<Image>();
  const consumePending = useRef<(() => void) | null>(null);
  const [error, setError] = useState<string>();
  // Whether the pending upload is a crop: Upload then reads "Crop and upload" and offers Reset
  const [crops, setCrops] = useState(false);
  // The server checks the date's format, not its range,
  // so Upload is disabled on an out-of-range date the same way Apply is
  const [uploadDateValid, setUploadDateValid] = useState(true);
  const cropStep = useRef<CropStepHandle>(null);

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
          if (!images.some((image) => image.id === created.id)) {
            append(created);
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

  const handleRecropped = (
    position: number,
    newImage: Image,
    addAsNew: boolean,
  ) => {
    if (addAsNew) append(newImage);
    else update(position, newImage);
    // The labels rode across onto the recropped row, so the source's own
    // unsaved draft has been spent and must not linger behind the picture
    consumePending.current?.();
    consumePending.current = null;
    setRecropTarget(undefined);
  };

  const isDisabled = maxImages !== undefined && images.length >= maxImages;
  const roomForAnother = maxImages === undefined || images.length < maxImages;

  // An organized image keeps its verified framing: a re-crop of it can only
  // be added alongside, so without room for another image there is nothing to offer
  const canRecrop = (
    imageId: string,
    { organized, types }: { organized: boolean; types: readonly string[] },
  ) => {
    if (!images.some((image) => image.id === imageId)) return false;
    if (templateFor(types) === undefined) return false;
    return !organized || roomForAnother;
  };

  // Only true for images that can have labels and crop controls
  const wantsRoom = file !== undefined && hasTemplates;

  // The crop starts from the labels on screen, saved or not, so picking a crop
  // label and re-cropping to it stays one action
  const openRecrop = (
    image: { id: string },
    categorization: { types: readonly string[]; date?: string | null },
    consume: () => void,
  ) => {
    const entry = images.find((candidate) => candidate.id === image.id);
    if (!entry) return;
    setError("");
    consumePending.current = consume;
    setRecropTarget({
      ...entry,
      types: [...categorization.types] as ImageTypeEnum[],
      date: categorization.date ?? null,
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
    <Row className={`${CLASSNAME} w-100`}>
      <Col xs={wantsRoom ? 4 : 7} className={CLASSNAME_IMAGES}>
        {images.map((i, index) => (
          <div className={CLASSNAME_IMAGE_ENTRY} key={i.id}>
            <ImageInput
              image={i}
              sizeVerdict={judgedCropSizeVerdict(
                i,
                i.originalImage ?? undefined,
                i.types,
              )}
              lightboxImages={images}
              onRemove={() => remove(index)}
              lightboxProps={{
                showCategorization,
                templateFor,
                onRecrop: openRecrop,
                canRecrop,
                renderCropEditor: (image) =>
                  recropTarget?.id === image.id ? (
                    <RecropEditor
                      image={recropTarget}
                      groups={groups}
                      canAddAsNew={roomForAnother}
                      addAsNewOnly={recropTarget.organized}
                      onClose={() => {
                        consumePending.current = null;
                        setRecropTarget(undefined);
                      }}
                      onRecropped={(newImage, addAsNew) => {
                        const position = images.findIndex(
                          (candidate) => candidate.id === recropTarget.id,
                        );
                        if (position >= 0)
                          handleRecropped(position, newImage, addAsNew);
                      }}
                    />
                  ) : undefined,
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
  );
};

export default EditImages;
