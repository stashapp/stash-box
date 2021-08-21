import React, { useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { Control, useFieldArray } from "react-hook-form";
import cx from "classnames";

import { useAddImage } from "src/graphql";
import { Image as ImageInput } from "src/components/form";
import { Icon, LoadingIndicator } from "src/components/fragments";

const CLASSNAME = "EditImages";
const CLASSNAME_DROP = `${CLASSNAME}-drop`;
const CLASSNAME_PLACEHOLDER = `${CLASSNAME}-placeholder`;
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_UPLOADING = `${CLASSNAME_IMAGE}-uploading`;

interface EditImagesProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  maxImages?: number;
}

const EditImages: React.FC<EditImagesProps> = ({ control, maxImages }) => {
  const {
    fields: images,
    append,
    remove,
  } = useFieldArray<{ images: Array<{ id: string; url: string }> }>({
    control,
    name: "images",
  });
  const [file, setFile] = useState<File | undefined>();
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

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    <Form.Row className={CLASSNAME}>
      <Col xs={7} className="d-flex flex-wrap justify-content-between">
        {images.map((i, index) => (
          <ImageInput image={i} onRemove={() => remove(index)} key={i.id} />
        ))}
      </Col>
      <Col xs={5}>
        <Row>
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
                <Form.File
                  onChange={onFileChange}
                  accept=".png,.jpg,.webp,.svg"
                />
                <div className={CLASSNAME_PLACEHOLDER}>
                  <Icon icon="images" />
                  <span>Add image</span>
                </div>
              </div>
            )
          )}
        </Row>
        <Row className="mt-1">
          {file && (
            <>
              <Button
                variant="danger"
                onClick={() => removeImage()}
                disabled={!file || uploading}
                className="ml-auto"
              >
                Remove
              </Button>
              <Button
                onClick={() => handleAddImage()}
                disabled={!file || uploading}
                className="ml-2 mr-auto"
              >
                Upload
              </Button>
            </>
          )}
        </Row>
      </Col>
    </Form.Row>
  );
};

export default EditImages;
