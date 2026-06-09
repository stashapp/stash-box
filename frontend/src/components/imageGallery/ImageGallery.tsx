import { faImages } from "@fortawesome/free-solid-svg-icons";
import { type FC, useMemo, useState } from "react";
import { Icon } from "src/components/fragments";
import Image from "src/components/image";
import type { ImageFragment } from "src/graphql";
import { sortImageURLs } from "src/utils";

import ImageLightbox from "./ImageLightbox";

interface ImageGalleryProps {
  images: ImageFragment[];
  orientation?: "portrait" | "landscape";
}

const ImageGallery: FC<ImageGalleryProps> = ({ images, orientation }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const sortedImages = useMemo(
    () => (orientation ? sortImageURLs(images, orientation) : images),
    [images, orientation],
  );

  if (sortedImages.length === 0) return <div />;

  return (
    <div className="ImageGallery">
      <button
        type="button"
        className="ImageGallery-hero"
        onClick={() => setShowLightbox(true)}
      >
        <Image
          images={sortedImages[0]}
          key={sortedImages[0].url}
          size={600}
          alt="Performer"
        />
        <span className="ImageGallery-count">
          <Icon icon={faImages} />
          {sortedImages.length}
        </span>
      </button>
      {showLightbox && (
        <ImageLightbox
          images={sortedImages}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  );
};

export default ImageGallery;
