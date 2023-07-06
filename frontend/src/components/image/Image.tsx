import { FC, useState } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { getImage } from "src/utils";
import { LoadingIndicator, Icon } from "src/components/fragments";
import { ImageFragment } from "src/graphql";

const CLASSNAME = "Image";

interface Props {
  images: ImageFragment[] | ImageFragment;
  orientation?: "landscape" | "portrait";
  emptyMessage?: string;
  size?: number;
}

const Image: FC<Props> = ({
  images,
  orientation = "landscape",
  emptyMessage = "No image",
  size,
}) => {
  const url = Array.isArray(images)
    ? getImage(images, orientation)
    : images.url;
  const [imageState, setImageState] = useState<"loading" | "error" | "done">(
    "loading"
  );

  if (!url) return <div className={`${CLASSNAME}-missing`}>{emptyMessage}</div>;

  const sizeQuery = size ? `?size=${size}` : '';

  return (
    <>
      {imageState === "loading" && (
        <LoadingIndicator message="Loading image..." delay={200} />
      )}
      {imageState === "error" && (
        <div>
          <span className="me-2">
            <Icon icon={faXmark} color="red" />
          </span>
          <span>Failed to load image</span>
        </div>
      )}
      <img
        alt=""
        src={`${url}${sizeQuery}`}
        className={`${CLASSNAME}-image`}
        onLoad={() => setImageState("done")}
        onError={() => setImageState("error")}
      />
    </>
  );
};

const ImageContainer: FC<Props> = (props) => (
  <div className={CLASSNAME}>
    <Image {...props} />
  </div>
);
export default ImageContainer;
