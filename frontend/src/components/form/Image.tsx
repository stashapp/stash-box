import { FC } from "react";
import { Button } from "react-bootstrap";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import { Icon } from "src/components/fragments";
import { ImageFragment } from "src/graphql";

interface ImageProps {
  image: Pick<ImageFragment, "id" | "url">;
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
    <img src={image.url} className={CLASSNAME_IMAGE} alt="" />
  </div>
);

export default ImageInput;
