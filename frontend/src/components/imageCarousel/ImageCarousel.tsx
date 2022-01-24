import { FC, useState } from "react";
import { Button } from "react-bootstrap";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

import { ImageFragment } from "src/graphql";
import Image from "src/components/image";
import { Icon } from "src/components/fragments";
import { sortImageURLs } from "src/utils";

interface ImageCarouselProps {
  images: ImageFragment[];
  orientation?: "portrait" | "landscape";
}

const ImageCarousel: FC<ImageCarouselProps> = ({ images, orientation }) => {
  const [imageIndex, setImageIndex] = useState(0);
  const sortedImages = orientation
    ? sortImageURLs(images, orientation)
    : images;

  if (sortedImages.length === 0) return <div />;

  const changeImage = (index: number) => {
    setImageIndex(index);
  };
  const setNext = () =>
    changeImage(imageIndex === sortedImages.length - 1 ? 0 : imageIndex + 1);
  const setPrev = () =>
    changeImage(imageIndex === 0 ? sortedImages.length - 1 : imageIndex - 1);

  return (
    <div className="image-carousel">
      <div className="image-container">
        <Button
          className="prev-button minimal"
          onClick={setPrev}
          disabled={sortedImages.length === 1}
          variant="link"
        >
          <Icon icon={faChevronLeft} />
        </Button>
        <div className="image-carousel-img">
          <Image
            images={sortedImages[imageIndex]}
            key={sortedImages[imageIndex].url}
          />
        </div>
        <Button
          className="next-button minimal"
          onClick={setNext}
          disabled={sortedImages.length === 1}
          variant="link"
        >
          <Icon icon={faChevronRight} />
        </Button>
      </div>

      <h5 className="text-center">
        {imageIndex + 1} of {sortedImages.length}
      </h5>
    </div>
  );
};

export default ImageCarousel;
