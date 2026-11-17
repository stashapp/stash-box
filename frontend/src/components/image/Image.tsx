import {
  faImages,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import { type FC, type ReactNode, useState } from "react";
import { Icon, LoadingIndicator } from "src/components/fragments";
import ImageLightbox, {
  type LightboxImage as Image,
  type ImageLightboxProps,
} from "./ImageLightbox";
import ImageTags from "./ImageTags";

const CLASSNAME = "Image";

type ImageSize = 1280 | 600 | 300 | "full";

interface ImageProps {
  image?: Image;
  emptyMessage?: string;
  size?: ImageSize;
  alt?: string;
  showTags?: boolean;
  loading?: "eager" | "lazy";
}

const ImageComponent: FC<ImageProps> = ({
  image,
  emptyMessage = "No image",
  size,
  alt,
  showTags = false,
  loading,
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
        loading={loading}
        className={`${CLASSNAME}-image`}
        onLoad={() => setImageState("done")}
        onError={() => setImageState("error")}
      />
      {showTags && <ImageTags imageId={image.id} />}
    </>
  );
};

export type LightboxProps = Omit<
  ImageLightboxProps,
  "images" | "defaultIndex" | "onClose"
>;

interface ContainerProps {
  images: Image[] | Image | undefined;
  emptyMessage?: string;
  size?: ImageSize;
  alt?: string;
  showTags?: boolean;
  loading?: "eager" | "lazy";
  className?: string;
  lightbox?: boolean;
  // Show these in the lightbox instead, opened on the displayed image
  lightboxImages?: Image[];
  // Inside the aspect-sized frame, so a corner lands on the image and not on letterboxing
  overlay?: ReactNode;
  lightboxProps?: LightboxProps;
}

const ImageContainer: FC<ContainerProps> = ({
  className,
  images,
  lightbox,
  lightboxImages,
  overlay,
  lightboxProps,
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
        {overlay}
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
          {...lightboxProps}
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
