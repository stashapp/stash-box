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
import {
  CropOverlay,
  type CropTemplateInfo,
  largestCenteredRect,
  matchesAspect,
} from "src/components/cropFrame";
import { Icon } from "src/components/fragments";
import type { CropGuide } from "src/graphql";
import { useMeasuredAspect } from "src/hooks";
import Image from "./Image";

type LightboxImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  originalImage?: { url: string } | null;
};

interface ImageLightboxProps {
  images: LightboxImage[];
  defaultIndex?: number;
  onClose: () => void;
  labels?: Record<string, string[]>;
  /**
   * The crop template each image claims to follow, keyed by image id. Its
   * guides are drawn over the focused image, and its aspect ratio is what the
   * dimensions are checked against
   */
  cropTemplates?: Record<string, CropTemplateInfo>;
  /**
   * Turns the lightbox into an editor for the focused image: one image large
   * enough to judge, the rest a click away, and controls belonging to exactly
   * one image rather than repeated down a grid
   */
  renderEditor?: (image: LightboxImage) => ReactNode;
  /** Absent hides the re-crop entrypoints entirely */
  onRecrop?: (image: LightboxImage) => void;
  canRecrop?: (imageId: string) => boolean;
  confirmLeave?: (imageId: string) => boolean;
  renderCropEditor?: (image: LightboxImage) => ReactNode;
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

/**
 * Draws a template's geometry over the picture, not over the box the picture sits in
 *
 * The two are not the same. `.Image` carries the image's aspect ratio, but the
 * lightbox column constrains it on both axes, and when the constraint that
 * binds is the one the ratio did not choose the box comes out a different shape
 * from the picture. `object-fit: contain` then letterboxes the picture inside
 * it, and an overlay drawn at 100% of the box reaches past the photograph:
 * differently at every viewport size, which is worse than being wrong consistently
 *
 * So the box is measured and the picture's own rectangle computed from it,
 * which is the same arithmetic `object-fit: contain` does. The overlay is then
 * placed on that rectangle and fitted within it as usual
 */
const FittedOverlay: FC<{
  guides: CropGuide[];
  templateAspect: number;
  imageAspect: number;
}> = ({ guides, templateAspect, imageAspect }) => {
  const { ref: measure, aspect: boxAspect } = useMeasuredAspect();

  const picture = largestCenteredRect(imageAspect, boxAspect ?? imageAspect);

  return (
    <div className="ImageLightbox-overlay-box" ref={measure}>
      <div
        style={{
          position: "absolute",
          left: `${picture.x * 100}%`,
          top: `${picture.y * 100}%`,
          width: `${picture.width * 100}%`,
          height: `${picture.height * 100}%`,
          visibility: boxAspect === undefined ? "hidden" : undefined,
        }}
      >
        <CropOverlay guides={guides} fit={{ templateAspect, imageAspect }} />
      </div>
    </div>
  );
};

const ImageLightbox: FC<ImageLightboxProps> = ({
  images,
  defaultIndex = 0,
  onClose,
  cropTemplates,
  labels,
  renderEditor,
  onRecrop,
  canRecrop,
  confirmLeave,
  renderCropEditor,
}) => {
  const [index, setIndex] = useState(defaultIndex);
  const [showGuides, setShowGuides] = useState(false);

  const focused = images[Math.min(index, images.length - 1)];

  // Every way focus can move away from the currently-focused image funnels
  // through here, so the guard only has to be written once. Memoized so the
  // arrow-key effect below can depend on it without re-subscribing its
  // listener on every render
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
  const recropAllowed = onRecrop && (canRecrop?.(focused?.id) ?? true);
  const template = cropTemplates?.[focused?.id];
  const focusedGuides = template?.guides ?? [];

  const hasOverlay = focusedGuides.length > 0;

  // Checked against the template the image claims rather than against a fixed
  // 2:3, so an instance with its own templates gets an answer about its own
  // rules. Aspect only, resolution is not policed
  const offAspect =
    template !== undefined &&
    !matchesAspect(focused.width, focused.height, template.aspectRatio);

  // Unusable dimensions mean no frame can be placed: an SVG stores -1 for both,
  // and inventing one would be worse than leaving the geometry where it is
  const overlayFit =
    template !== undefined && focused.width > 0 && focused.height > 0
      ? {
          templateAspect: template.aspectRatio,
          imageAspect: focused.width / focused.height,
        }
      : undefined;

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

  const cropEditor = renderCropEditor?.(focused);

  return (
    <Modal show fullscreen onHide={handleClose} dialogClassName="ImageLightbox">
      <Modal.Body onClick={closeOnBackgroundClick}>
        <div
          className={cx("ImageLightbox-main", {
            "ImageLightbox-main-editing": !!renderEditor,
          })}
        >
          {cropEditor ?? (
            <>
              {renderEditor && (
                <div
                  className="ImageLightbox-editor"
                  role="group"
                  aria-label="Edit this image"
                >
                  {renderEditor(focused)}
                </div>
              )}
              <div className="ImageLightbox-picture">
                <Image
                  images={focused}
                  key={focused.url}
                  size="full"
                  // No need to show labels as an overlay once there's an
                  // editor showing them in its own column instead
                  overlay={
                    <>
                      {!renderEditor && (
                        <Labels labels={labels?.[focused.id]} />
                      )}
                      {showGuides && hasOverlay && overlayFit && (
                        <FittedOverlay
                          guides={focusedGuides}
                          templateAspect={overlayFit.templateAspect}
                          imageAspect={overlayFit.imageAspect}
                        />
                      )}
                    </>
                  }
                />
                <span className="ImageLightbox-caption">
                  {images.length > 1 && (
                    <>
                      {index + 1}/{images.length} &middot;{" "}
                    </>
                  )}
                  {focused.width}&times;{focused.height}
                  {focused.originalImage && (
                    <>
                      {" "}
                      &middot;{" "}
                      <a
                        className="ImageLightbox-original-link"
                        href={focused.originalImage.url}
                        target="_blank"
                        rel="noreferrer"
                        title="This image has been cropped; opens the uncropped original in a new tab"
                      >
                        Cropped &ndash; view original
                      </a>
                    </>
                  )}
                  {hasOverlay && (
                    <>
                      {" "}
                      &middot;{" "}
                      <Button
                        className="ImageLightbox-guide-toggle minimal"
                        variant="link"
                        aria-pressed={showGuides}
                        onClick={() => setShowGuides((shown) => !shown)}
                      >
                        {showGuides ? "Hide guides" : "Show guides"}
                      </Button>
                    </>
                  )}
                  {recropAllowed && (
                    <>
                      {" "}
                      &middot;{" "}
                      <Button
                        className={cx("ImageLightbox-recrop minimal", {
                          "ImageLightbox-recrop-off-aspect": offAspect,
                        })}
                        variant="link"
                        title={
                          offAspect
                            ? "These proportions do not match the crop this image is labelled with"
                            : undefined
                        }
                        onClick={() => onRecrop?.(focused)}
                      >
                        Re-crop
                      </Button>
                    </>
                  )}
                </span>
              </div>
            </>
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
