import React from "react";
import { Button } from "react-bootstrap";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

import { Icon } from "src/components/fragments";
import { Image } from "src/utils/transforms";

interface ImageProps {
  image: Pick<Image, "id" | "url">;
  onRemove: () => void;
}

const CLASSNAME = "ImageInput";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_REMOVE = `${CLASSNAME}-remove`;

const ImageInput: React.FC<ImageProps> = ({ image, onRemove }) => (
  <div className={CLASSNAME}>
    <Button
      variant="danger"
      className={CLASSNAME_REMOVE}
      onClick={() => onRemove()}
    >
      <Icon icon={faTimes} />
    </Button>
    <img src={image.url} className={CLASSNAME_IMAGE} alt="" />
  </div>
);

export default ImageInput;
