import React, { useState } from "react";
import { Button } from "react-bootstrap";

import { Icon } from "src/components/fragments";
import { Image, sortImageURLs } from "src/utils/transforms";

interface ImageCarouselProps {
  images: Image[];
  orientation?: "portrait" | "landscape";
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  orientation = "portrait",
}) => {
  const [activeImage, setActiveImage] = useState(0);
  const sortedImages = sortImageURLs(images, orientation);

  if (sortedImages.length === 0) return <div />;

  const setNext = () =>
    setActiveImage(
      activeImage === sortedImages.length - 1 ? 0 : activeImage + 1
    );
  const setPrev = () =>
    setActiveImage(
      activeImage === 0 ? sortedImages.length - 1 : activeImage - 1
    );

  return (
    <div className="image-carousel">
      <img
        src={sortedImages[activeImage].url}
        alt=""
        className="image-carousel-img"
      />
      <div className="d-flex align-items-center">
        <Button className="mr-auto" onClick={setPrev}>
          <Icon icon="arrow-left" />
        </Button>
        <h5>
          Image {activeImage + 1} of {sortedImages.length}
        </h5>
        <Button className="ml-auto" onClick={setNext}>
          <Icon icon="arrow-right" />
        </Button>
      </div>
    </div>
  );
};

export default ImageCarousel;
