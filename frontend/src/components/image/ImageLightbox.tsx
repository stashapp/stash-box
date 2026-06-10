import { faXmark } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import { type CSSProperties, type FC, useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { Icon } from "src/components/fragments";
import Image from "./Image";

type LightboxImage = {
  id: string;
  url: string;
  width: number;
  height: number;
};

interface ImageLightboxProps {
  images: LightboxImage[];
  defaultIndex?: number;
  onClose: () => void;
}

const ImageLightbox: FC<ImageLightboxProps> = ({
  images,
  defaultIndex = 0,
  onClose,
}) => {
  const [index, setIndex] = useState(defaultIndex);

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

  // Close on background clicks, but not on the image, caption or thumbs
  const closeOnBackgroundClick = (e: React.MouseEvent) => {
    if (
      e.target instanceof HTMLElement &&
      (e.target === e.currentTarget ||
        e.target.classList.contains("ImageLightbox-main") ||
        e.target.classList.contains("ImageLightbox-thumbs"))
    )
      onClose();
  };

  // Scale thumbnails to the collection: few images get large thumbs,
  // large collections get a compact grid.
  const thumbHeight =
    images.length <= 4 ? 300 : images.length <= 12 ? 220 : 160;

  return (
    <Modal show fullscreen onHide={onClose} dialogClassName="ImageLightbox">
      <Modal.Body onClick={closeOnBackgroundClick}>
        <div className="ImageLightbox-main">
          <Image images={images[index]} key={images[index].url} size="full" />
          <Button
            className="ImageLightbox-close minimal"
            onClick={onClose}
            variant="link"
          >
            <Icon icon={faXmark} />
          </Button>
          <span className="ImageLightbox-caption">
            {images.length > 1 && (
              <>
                {index + 1}/{images.length} &middot;{" "}
              </>
            )}
            {images[index].width}&times;{images[index].height}
          </span>
        </div>
        {images.length > 1 && (
          <div
            className="ImageLightbox-thumbs"
            style={{ "--thumb-height": `${thumbHeight}px` } as CSSProperties}
          >
            {images.map((image, i) => (
              <button
                type="button"
                key={image.id}
                ref={i === index ? scrollIntoView : undefined}
                className={cx("ImageLightbox-thumb", { selected: i === index })}
                style={{ aspectRatio: `${image.width} / ${image.height}` }}
                onClick={() => setIndex(i)}
              >
                <img src={`${image.url}?size=300`} loading="lazy" alt="" />
                <span className="ImageLightbox-thumb-dims">
                  {image.width}&times;{image.height}
                </span>
              </button>
            ))}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ImageLightbox;
