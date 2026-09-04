import { faXmark } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import {
  type CSSProperties,
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
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
  labels?: Record<string, string[]>;
  renderEditor?: (image: LightboxImage) => ReactNode;
  /**
   * Asked before focus moves away from an image, so unsaved labels/date
   * (nothing here autosaves) aren't silently lost by switching images or
   * closing. Returning false blocks the move.
   */
  confirmLeave?: (imageId: string) => boolean;
}

const Labels: FC<{ labels?: string[] }> = ({ labels }) =>
  labels?.length ? (
    <span className="ImageLightbox-labels">
      {labels.map((label) => (
        <span key={label} className="ImageLightbox-label">
          {label}
        </span>
      ))}
    </span>
  ) : null;

const ImageLightbox: FC<ImageLightboxProps> = ({
  images,
  defaultIndex = 0,
  onClose,
  labels,
  renderEditor,
  confirmLeave,
}) => {
  const [index, setIndex] = useState(defaultIndex);

  const focused = images[Math.min(index, images.length - 1)];

  // Every way focus can move away from the currently-focused image funnels
  // through here, so the guard only has to be written once.
  const goTo = useCallback(
    (nextIndex: number) => {
      if (focused && confirmLeave && !confirmLeave(focused.id)) return;
      setIndex(nextIndex);
    },
    [focused, confirmLeave],
  );
  const handleClose = () => {
    if (focused && confirmLeave && !confirmLeave(focused.id)) return;
    onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // We don't want an arrow key to move to the next image if it's inside of the date input for example
      if (
        e.target instanceof Element &&
        e.target.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }

      if (e.key === "ArrowRight") goTo(Math.min(index + 1, images.length - 1));
      if (e.key === "ArrowLeft") goTo(Math.max(index - 1, 0));
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [images.length, index, goTo]);

  const scrollIntoView = useCallback(
    (el: HTMLButtonElement | null) => el?.scrollIntoView({ block: "nearest" }),
    [],
  );

  // Close on background clicks, but not on the image, caption or thumbs
  const closeOnBackgroundClick = (e: React.MouseEvent) => {
    if (
      e.target instanceof HTMLElement &&
      (e.target === e.currentTarget ||
        e.target.classList.contains("ImageLightbox-main") ||
        e.target.classList.contains("ImageLightbox-thumbs"))
    )
      handleClose();
  };

  // Scale thumbnails to the collection: few images get large thumbs,
  // large collections get a compact grid.
  const thumbHeight =
    images.length <= 4 ? 300 : images.length <= 12 ? 220 : 160;

  return (
    <Modal show fullscreen onHide={handleClose} dialogClassName="ImageLightbox">
      <Modal.Body onClick={closeOnBackgroundClick}>
        <div className="ImageLightbox-main">
          <Image
            images={focused}
            key={focused.url}
            size="full"
            // No need to show labels as an overlay once there's an editor
            // showing them already
            overlay={
              renderEditor ? undefined : (
                <Labels labels={labels?.[focused.id]} />
              )
            }
          />
          <span className="ImageLightbox-caption">
            {images.length > 1 && (
              <>
                {index + 1}/{images.length} &middot;{" "}
              </>
            )}
            {focused.width}&times;{focused.height}
          </span>
          {renderEditor && (
            <div
              className="ImageLightbox-editor"
              role="group"
              aria-label="Edit this image"
            >
              {renderEditor(focused)}
            </div>
          )}
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
                className={cx("ImageLightbox-thumb", {
                  selected: i === index,
                })}
                style={{ aspectRatio: `${image.width} / ${image.height}` }}
                onClick={() => goTo(i)}
              >
                <img src={`${image.url}?size=300`} loading="lazy" alt="" />
                <span className="ImageLightbox-thumb-footer">
                  {/* Unconditional, including in editor mode: the editor only
                      ever shows the focused image's own labels, so it says
                      nothing about the rest of the thumbnails here -- which
                      is the one place their labels are visible at a glance. */}
                  {labels?.[image.id]?.map((label) => (
                    <span key={label} className="ImageLightbox-thumb-label">
                      {label}
                    </span>
                  ))}
                  <span className="ImageLightbox-thumb-dims">
                    {image.width}&times;{image.height}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
        <Button
          className="ImageLightbox-close minimal"
          onClick={handleClose}
          variant="link"
        >
          <Icon icon={faXmark} />
        </Button>
      </Modal.Body>
    </Modal>
  );
};

export default ImageLightbox;
