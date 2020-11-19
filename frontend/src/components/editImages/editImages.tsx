import React, { useState } from "react";
import { loader } from "graphql.macro";

import { Icon } from "src/components/fragments";
import { Image } from "src/utils/transforms";
import { Button, Col, Form, Row } from "react-bootstrap";

import { AddImageMutation as AddImage, AddImageMutationVariables } from "src/definitions/AddImageMutation";
import { useMutation } from "@apollo/client";
import ImageCarousel from "../imageCarousel";

const AddImageMutation = loader("src/mutations/AddImage.gql");

interface EditImagesProps {
  images: Image[];
  onImagesChanged: (images: Image[]) => void;
}

const EditImages: React.FC<EditImagesProps> = ({
  images,
  onImagesChanged
}) => {
  const [file, setFile] = useState<File | undefined>();

  function onRemoveImage(toRemove: Image) {
    onImagesChanged(images.filter(i => i.id !== toRemove.id));
  }

  const [addImage] = useMutation<AddImage, AddImageMutationVariables>(AddImageMutation);

  function onAddImage() {
    addImage({variables: {
      imageData: { file }
    }}).then((i) => {
      if (i.data?.imageCreate) {
        onImagesChanged(images.concat(i.data.imageCreate));
      }
    });
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (
      event.target.validity.valid &&
      event.target.files &&
      event.target.files.length > 0
    ) {
      setFile(event.target.files[0]);
    }
  }

  return (
    <div>
      <div className="edit-image-images">
        <ImageCarousel
          images={images}
          onDeleteImage={(i) => onRemoveImage(i)}
        />
      </div>

      <Row className="my-2">
        <Col xs={6}>
          <Form.File onChange={onFileChange} accept=".png,.jpg" />
        </Col>
        <Col xs={6} className="d-flex justify-content-end">
          <Button 
            onClick={() => onAddImage()}
            disabled={!file}
          >
            Add
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default EditImages;
