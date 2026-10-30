import { faXmark } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Button } from "react-bootstrap";

import { Icon, Thumbnail } from "src/components/fragments";
import Image from "src/components/image";
import type { ImageFragment } from "src/graphql";

type ImageType = Pick<ImageFragment, "id" | "url" | "width" | "height">;

interface ImageProps {
  image: ImageType;
  lightboxImages?: ImageType[];
  onRemove: () => void;
  showCategorization?: boolean;
}

const CLASSNAME = "ImageInput";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_REMOVE = `${CLASSNAME}-remove`;

const ImageInput: FC<ImageProps> = ({
  image,
  lightboxImages,
  onRemove,
  showCategorization,
}) => (
  <div className={CLASSNAME}>
    <Button
      variant="danger"
      className={CLASSNAME_REMOVE}
      onClick={() => onRemove()}
    >
      <Icon icon={faXmark} />
    </Button>
    <Image
      images={image}
      className={CLASSNAME_IMAGE}
      lightboxImages={lightboxImages}
      showCategorization={showCategorization}
    >
      <Thumbnail image={image.url} size={300} className="Image-image" alt="" />
    </Image>
    <div className="text-center">
      {image.width} x {image.height}
    </div>
  </div>
);

export default ImageInput;
