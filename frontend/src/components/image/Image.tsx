import {
  faImages,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import { type FC, useState } from "react";
import { Icon, LoadingIndicator } from "src/components/fragments";
import ImageLightbox from "./ImageLightbox";

const CLASSNAME = "Image";

type Image = {
  id: string;
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
  emptyMessage?: string;
  size?: ImageSize;
  alt?: string;
  className?: string;
  lightbox?: boolean;
  // Show these in the lightbox instead, opened on the displayed image
  lightboxImages?: Image[];
}

const ImageContainer: FC<ContainerProps> = ({
  className,
  images,
  lightbox,
  lightboxImages,
  ...props
}) => {
  const [showLightbox, setShowLightbox] = useState(false);

  const imageArray = Array.isArray(images) ? images : images ? [images] : [];
  const image = imageArray[0];
  const galleryImages = lightboxImages ?? (lightbox ? imageArray : undefined);

  const aspectRatio = image ? `${image.width}/${image.height}` : "16/6";

  if (!galleryImages || !image)
    return (
      <div className={cx(CLASSNAME, className)} style={{ aspectRatio }}>
        <ImageComponent {...props} image={image} />
      </div>
    );

  return (
    <>
      <button
        type="button"
        className={cx(CLASSNAME, className)}
        style={{ aspectRatio }}
        onClick={() => setShowLightbox(true)}
      >
        <ImageComponent {...props} image={image} />
        <span className={`${CLASSNAME}-magnify`}>
          <Icon icon={faMagnifyingGlass} />
        </span>
        {imageArray.length > 1 && (
          <span className={`${CLASSNAME}-count`}>
            <Icon icon={faImages} />
            {imageArray.length}
          </span>
        )}
      </button>
      {showLightbox && (
        <ImageLightbox
          images={galleryImages}
          defaultIndex={Math.max(
            0,
            galleryImages.findIndex((i) => i.id === image.id),
          )}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </>
  );
};
export default ImageContainer;
