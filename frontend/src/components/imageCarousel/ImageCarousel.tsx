import React, { useState } from "react";
import { Button } from "react-bootstrap";
import cx from "classnames";

import { Icon, LoadingIndicator } from "src/components/fragments";
import { Image, sortImageURLs } from "src/utils";

interface ImageCarouselProps {
  images: Image[];
  orientation?: "portrait" | "landscape";
  onDeleteImage?: (toDelete: Image) => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  orientation,
  onDeleteImage,
}) => {
  const [imageIndex, setImageIndex] = useState(0);
  const [imageState, setImageState] = useState<
    "loading" | "error" | "loaded" | "empty"
  >("empty");
  const [loadDict, setLoadDict] = useState<Record<number, boolean>>({});
  const sortedImages = orientation
    ? sortImageURLs(images, orientation)
    : images;

  if (sortedImages.length === 0) return <div />;

  const changeImage = (index: number) => {
    setImageIndex(index);
    if (!loadDict[index]) setImageState("loading");
  };
  const setNext = () =>
    changeImage(imageIndex === sortedImages.length - 1 ? 0 : imageIndex + 1);
  const setPrev = () =>
    changeImage(imageIndex === 0 ? sortedImages.length - 1 : imageIndex - 1);

  const handleLoad = (index: number) => {
    setLoadDict({
      ...loadDict,
      [index]: true,
    });
    setImageState("loaded");
  };
  const handleError = () => setImageState("error");

  const handleDelete = () => {
    const deletedImage = sortedImages[imageIndex];
    if (onDeleteImage && deletedImage) {
      onDeleteImage(deletedImage);
      setImageIndex(imageIndex === 0 ? 0 : imageIndex - 1);
    }
  };

  return (
    <div className="image-carousel">
      <div className="image-container">
        <Button
          className="prev-button minimal"
          onClick={setPrev}
          disabled={sortedImages.length === 1}
          variant="link"
        >
          <Icon icon="chevron-left" />
        </Button>
        <div className="image-carousel-img">
          <img
            src={sortedImages[imageIndex].url}
            alt=""
            className={cx({ "d-none": imageState !== "loaded" })}
            onLoad={() => handleLoad(imageIndex)}
            onError={handleError}
          />
          {imageState === "loading" && (
            <LoadingIndicator message="Loading image..." />
          )}
          {imageState === "error" && (
            <div className="h-100 d-flex justify-content-center align-items-center">
              <b>Error loading image.</b>
            </div>
          )}
          {onDeleteImage ? (
            <div className="delete-image-overlay">
              <Button variant="danger" size="sm" onClick={handleDelete}>
                <Icon icon="times" />
              </Button>
            </div>
          ) : undefined}
        </div>
        <Button
          className="next-button minimal"
          onClick={setNext}
          disabled={sortedImages.length === 1}
          variant="link"
        >
          <Icon icon="chevron-right" />
        </Button>
      </div>

      <h5 className="text-center">
        {imageIndex + 1} of {sortedImages.length}
      </h5>
    </div>
  );
};

export default ImageCarousel;
