import { FC, useState } from "react";
import cx from "classnames";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { sortImageURLs } from "src/utils";
import { LoadingIndicator, Icon } from "src/components/fragments";

const CLASSNAME = "Image";

type Image = {
  url: string;
  width: number;
  height: number;
};

type ImageSize = 1280 | 600 | 300 | "full";

interface ImageProps {
  image?: Image;
  emptyMessage?: string;
  size?: ImageSize;
  alt?: string;
}

const ImageComponent: FC<ImageProps> = ({
  image,
  emptyMessage = "No image",
  size,
  alt,
}) => {
  const [imageState, setImageState] = useState<"loading" | "error" | "done">(
    "loading",
  );

  if (!image?.url)
    return (
      <div className={`${CLASSNAME}-missing`}>
        <Icon icon={faXmark} color="var(--bs-gray-400)" />
        <div>{emptyMessage}</div>
      </div>
    );

  const sizeQuery = size ? `?size=${size}` : "";

  return (
    <>
      {imageState === "loading" && (
        <LoadingIndicator message="Loading image..." delay={200} />
      )}
      {imageState === "error" && (
        <div className="Image-error">
          <Icon icon={faXmark} color="red" />
          <div>Failed to load image</div>
        </div>
      )}
      <img
        alt={alt ?? ""}
        src={`${image.url}${sizeQuery}`}
        className={`${CLASSNAME}-image`}
        onLoad={() => setImageState("done")}
        onError={() => setImageState("error")}
      />
    </>
  );
};

interface ContainerProps {
  images: Image[] | Image | undefined;
  orientation?: "landscape" | "portrait";
  emptyMessage?: string;
  size?: ImageSize;
  alt?: string;
  className?: string;
}

const ImageContainer: FC<ContainerProps> = ({
  className,
  images,
  orientation = "landscape",
  ...props
}) => {
  const image = Array.isArray(images)
    ? sortImageURLs(images, orientation)[0]
    : images;

  const aspectRatio = image ? `${image.width}/${image.height}` : "16/6";

  return (
    <div className={cx(CLASSNAME, className)} style={{ aspectRatio }}>
      <ImageComponent {...props} image={image} />
    </div>
  );
};
export default ImageContainer;
