import { FC } from "react";
import { Button } from "react-bootstrap";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import { Icon } from "src/components/fragments";
import Image from "src/components/image";
import { ImageFragment } from "src/graphql";

interface ImageProps {
  image: Pick<ImageFragment, "id" | "url" | "width" | "height">;
  onRemove: () => void;
}

const CLASSNAME = "ImageInput";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_REMOVE = `${CLASSNAME}-remove`;

const ImageInput: FC<ImageProps> = ({ image, onRemove }) => (
  <div className={CLASSNAME}>
    <Button
      variant="danger"
      className={CLASSNAME_REMOVE}
      onClick={() => onRemove()}
    >
      <Icon icon={faXmark} />
    </Button>
    <Image images={image} className={CLASSNAME_IMAGE} size="full" />
  </div>
);

export default ImageInput;
