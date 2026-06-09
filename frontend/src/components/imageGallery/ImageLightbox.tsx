import { faXmark } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import { type FC, useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { Icon } from "src/components/fragments";
import Image from "src/components/image";
import type { ImageFragment } from "src/graphql";

interface ImageLightboxProps {
  images: ImageFragment[];
  onClose: () => void;
}

const ImageLightbox: FC<ImageLightboxProps> = ({ images, onClose }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight")
        setIndex((i) => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [images.length]);

  const scrollIntoView = (el: HTMLButtonElement | null) =>
    el?.scrollIntoView({ block: "nearest" });

  return (
    <Modal show fullscreen onHide={onClose} dialogClassName="ImageLightbox">
      <Modal.Body>
        <div className="ImageLightbox-main">
          <Image
            images={images[index]}
            key={images[index].url}
            size={1280}
            alt="Performer"
          />
          <Button
            className="ImageLightbox-close minimal"
            onClick={onClose}
            variant="link"
          >
            <Icon icon={faXmark} />
          </Button>
        </div>
        <div className="ImageLightbox-thumbs">
          {images.map((image, i) => (
            <button
              type="button"
              key={image.id}
              ref={i === index ? scrollIntoView : undefined}
              className={cx("ImageLightbox-thumb", { selected: i === index })}
              onClick={() => setIndex(i)}
            >
              <img src={`${image.url}?size=300`} loading="lazy" alt="" />
              <span className="ImageLightbox-thumb-dims">
                {image.width}&times;{image.height}
              </span>
            </button>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ImageLightbox;
