import React from "react";
import { Button, Card, Form } from 'react-bootstrap';
import { Controller } from 'react-hook-form';

import { Performer_findPerformer_images as Image } from 'src/definitions/Performer';

interface ImageProps {
  image: Image;
  onRemove: (id: string) => void;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  control: any;
};

const CLASSNAME = "ImageInput";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_METADATA = `${CLASSNAME}-metadata`;
const CLASSNAME_BUTTON = `${CLASSNAME}-button`;

const ImageInput: React.FC<ImageProps> = ({
  image,
  control,
  onRemove,
}) => {
  return (
    <Form.Row className={CLASSNAME} key={image.id}>
      <Card className={CLASSNAME_METADATA}>
        <Card.Body>
          <Controller
            type="hidden"
            name={`images[${image.id}]`}
            control={control}
            defaultValue={image.id}
          />
          <div><b>ID:</b> { image.id }</div>
          <div className="text-truncate"><b>URL:</b> { image.url}</div>
          <div><b>Dimensions:</b> { `${image.width}x${image.height}` }</div>
        </Card.Body>
        <Card.Footer>
          <Button variant="danger" className={CLASSNAME_BUTTON} onClick={() => onRemove(image.id)}>Remove</Button>
        </Card.Footer>
      </Card>
      <img src={image.url} className={CLASSNAME_IMAGE} alt="" />
    </Form.Row>
  );
};

export default ImageInput
