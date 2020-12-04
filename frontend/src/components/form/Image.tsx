import React from "react";
import { Button, Card, Form } from 'react-bootstrap';

import { Performer_findPerformer_images as Image } from 'src/definitions/Performer';

interface ImageProps {
  image: Image;
  onRemove: (index: number) => void;
  index: number;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  register: any;
};

const CLASSNAME = "ImageInput";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_METADATA = `${CLASSNAME}-metadata`;
const CLASSNAME_BUTTON = `${CLASSNAME}-button`;

const ImageInput: React.FC<ImageProps> = ({
  image,
  register,
  onRemove,
  index
}) => {
  return (
    <Form.Row className={CLASSNAME} key={image.id}>
      <Card className={CLASSNAME_METADATA}>
        <Form.Control
          type="hidden"
          name={`images[${index}]`}
          value={image.id}
          ref={register}
        />
        <div><b>ID:</b> { image.id }</div>
        <div className="text-truncate"><b>URL:</b> { image.url}</div>
        <div><b>Dimensions:</b> { `${image.width}x${image.height}` }</div>
        <Button variant="danger" className={CLASSNAME_BUTTON} onClick={() => onRemove(index)}>Remove</Button>
      </Card>
      <img src={image.url} className={CLASSNAME_IMAGE} alt="" />
    </Form.Row>
  );
};

export default ImageInput
