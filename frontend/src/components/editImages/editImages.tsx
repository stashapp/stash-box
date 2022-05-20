import { FC, ChangeEvent, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { Control, useFieldArray } from "react-hook-form";
import { faImages } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

import { useAddImage } from "src/graphql";
import { Image as ImageInput } from "src/components/form";
import { Icon, LoadingIndicator } from "src/components/fragments";

const CLASSNAME = "EditImages";
const CLASSNAME_IMAGES = `${CLASSNAME}-images`;
const CLASSNAME_INPUT = `${CLASSNAME}-input`;
const CLASSNAME_DROP = `${CLASSNAME}-drop`;
const CLASSNAME_PLACEHOLDER = `${CLASSNAME}-placeholder`;
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_UPLOADING = `${CLASSNAME_IMAGE}-uploading`;

interface EditImagesProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  file: File | undefined;
  setFile: (f: File | undefined) => void;
  maxImages?: number;
  /** Whether to allow svg/png image input */
  allowLossless?: boolean;
}

const EditImages: FC<EditImagesProps> = ({
  control,
  maxImages,
  file,
  setFile,
  allowLossless = false,
}) => {
  const {
    fields: images,
    append,
    remove,
  } = useFieldArray<
    { images: Array<{ id: string; url: string; key: string }> },
    "images",
    "key"
  >({
    control,
    name: "images",
    keyName: "key",
  });

  const [imageData, setImageData] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [addImage] = useAddImage();

  const handleAddImage = () => {
    setUploading(true);
    addImage({
      variables: {
        imageData: { file },
      },
    })
      .then((i) => {
        if (i.data?.imageCreate?.id) {
          if (!images.some((image) => image.id === i.data?.imageCreate?.id)) {
            append(i.data.imageCreate);
          }
          setFile(undefined);
          setImageData("");
        }
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const removeImage = () => {
    setFile(undefined);
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
          <ImageInput image={i} onRemove={() => remove(index)} key={i.id} />
        ))}
      </Col>
      <Col xs={5} className={CLASSNAME_INPUT}>
        <div className="d-flex">
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
                    ".webp",
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
        {file && (
          <>
            <Button
              variant="danger"
              onClick={() => removeImage()}
              disabled={!file || uploading}
              className="ms-auto"
            >
              Remove
            </Button>
            <Button
              onClick={() => handleAddImage()}
              disabled={!file || uploading}
              className="ms-2 me-auto"
            >
              Upload
            </Button>
          </>
        )}
      </Col>
    </Row>
  );
};

export default EditImages;
