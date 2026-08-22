import { CombinedGraphQLErrors } from "@apollo/client";
import { faImages } from "@fortawesome/free-solid-svg-icons";
import type { Lens } from "@hookform/lenses";
import cx from "classnames";
import { type ChangeEvent, type FC, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useFieldArray } from "react-hook-form";
import { Image as ImageInput } from "src/components/form";
import { Icon, LoadingIndicator } from "src/components/fragments";
import {
  type ImageTypeScopeEnum,
  useAddImage,
  useImageTypeGroups,
} from "src/graphql";

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

  const [imageData, setImageData] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [addImage] = useAddImage();
  const [error, setError] = useState<string>();

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

  const isDisabled = maxImages !== undefined && images.length >= maxImages;

  return (
    <Row className={`${CLASSNAME} w-100`}>
      <Col xs={7} className={CLASSNAME_IMAGES}>
        {images.map((i, index) => (
          <div className={CLASSNAME_IMAGE_ENTRY} key={i.image.id}>
            <ImageInput
              image={i.image}
              lightboxImages={images.map((image) => image.image)}
              onRemove={() => remove(index)}
              labels={labels}
              renderEditor={
                labellable
                  ? (image) => {
                      const position = images.findIndex(
                        (candidate) => candidate.image.id === image.id,
                      );
                      if (position < 0) return null;

                      // Drop the key, it does not need to be propagated
                      const { key: _key, ...current } = images[position];

                      return (
                        <ImageLabels
                          groups={groups}
                          value={current}
                          onChange={(value) => update(position, value)}
                        />
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
  );
};

export default EditImages;
