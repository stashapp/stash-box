import React from "react";
import { Button } from "react-bootstrap";
import { Controller } from "react-hook-form";

import { Icon } from "src/components/fragments";
import { Image } from "src/utils/transforms";

interface ImageProps {
  image: Image;
  onRemove: (id: string) => void;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  control: any;
}

const CLASSNAME = "ImageInput";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_REMOVE = `${CLASSNAME}-remove`;

const ImageInput: React.FC<ImageProps> = ({ image, control, onRemove }) => (
  <div className={CLASSNAME}>
    <Controller
      type="hidden"
      name={`images[${image.id}]`}
      control={control}
      defaultValue={image.id}
      render={() => <></>}
    />
    <Button
      variant="danger"
      className={CLASSNAME_REMOVE}
      onClick={() => onRemove(image.id)}
    >
      <Icon icon="times" />
    </Button>
    <img src={image.url} className={CLASSNAME_IMAGE} alt="" />
  </div>
);

export default ImageInput;
