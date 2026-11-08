import { faImages } from "@fortawesome/free-solid-svg-icons";
import type { Lens } from "@hookform/lenses";
import { type ChangeEvent, type FC, useState } from "react";
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

import CropStep from "./CropStep";

const CLASSNAME = "EditImages";
const CLASSNAME_IMAGES = `${CLASSNAME}-images`;
const CLASSNAME_INPUT = `${CLASSNAME}-input`;
const CLASSNAME_INPUT_CONTAINER = `${CLASSNAME_INPUT}-container`;
const CLASSNAME_DROP = `${CLASSNAME}-drop`;
const CLASSNAME_PLACEHOLDER = `${CLASSNAME}-placeholder`;

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

  const [uploading, setUploading] = useState(false);
  const [addImage] = useAddImage();
  const [error, setError] = useState<string>();

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
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.validity.valid && event.target.files?.[0]) {
      setFile(event.target.files[0]);
      setError("");
    }
  };

  const roomForAnother = maxImages === undefined || images.length < maxImages;

  const recrop = {
    canAddAsNew: roomForAnother,
    onRecropped: (sourceId: string, image: Image, addAsNew: boolean) => {
      const position = images.findIndex(
        (candidate) => candidate.id === sourceId,
      );
      if (addAsNew) append(image);
      else if (position >= 0) update(position, image);
    },
  };

  // Only true for images that can have labels and crop controls
  const wantsRoom =
    file !== undefined &&
    groups.some((group) => group.types.some((type) => type.crop_template));

  return (
    <Row className={`${CLASSNAME} w-100`}>
      <Col xs={wantsRoom ? 4 : 7} className={CLASSNAME_IMAGES}>
        {images.map((i, index) => (
          <ImageInput
            key={i.id}
            image={i}
            sizeVerdict={judgedCropSizeVerdict(
              i,
              i.originalImage ?? undefined,
              i.types,
            )}
            lightboxImages={images}
            onRemove={() => remove(index)}
            lightboxProps={{ showCategorization, recrop }}
          />
        ))}
      </Col>
      <Col xs={wantsRoom ? 8 : 5} className={CLASSNAME_INPUT}>
        <div className={CLASSNAME_INPUT_CONTAINER}>
          {file ? (
            <CropStep
              file={file}
              groups={groups}
              uploading={uploading}
              onRemove={removeImage}
              onUpload={handleAddImage}
            />
          ) : (
            roomForAnother && (
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
  );
};

export default EditImages;
