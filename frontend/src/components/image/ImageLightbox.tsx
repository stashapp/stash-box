import { faCircleCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
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
import { Icon, Tooltip } from "src/components/fragments";
import type { CropGuide } from "src/graphql";
import { useMeasuredAspect } from "src/hooks";
import Image from "./Image";

type LightboxImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  originalImage?: { url: string } | null;
  organized?: boolean;
};

interface ImageLightboxProps {
  images: LightboxImage[];
  defaultIndex?: number;
  onClose: () => void;
  labels?: Record<string, string[]>;
  cropTemplates?: Record<string, CropTemplateInfo>;
  renderEditor?: (image: LightboxImage) => ReactNode;
  editorLabel?: string;
  /** Absent hides the re-crop entrypoints entirely */
  onRecrop?: (image: LightboxImage) => void;
  canRecrop?: (imageId: string) => boolean;
  confirmLeave?: (imageId: string, proceed: () => void) => void;
  renderCropEditor?: (image: LightboxImage) => ReactNode;
}

const GUIDES_STORAGE = "ImageLightbox.guides";

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
        className="ImageLightbox-overlay-picture"
        style={{
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
  editorLabel = "Edit this image",
  onRecrop,
  canRecrop,
  confirmLeave,
  renderCropEditor,
}) => {
  const [index, setIndex] = useState(defaultIndex);
  const [showGuides, setShowGuides] = useState(
    () => sessionStorage.getItem(GUIDES_STORAGE) === "1",
  );
  const toggleGuides = () => {
    const next = !showGuides;
    sessionStorage.setItem(GUIDES_STORAGE, next ? "1" : "0");
    setShowGuides(next);
  };

  const focused = images[Math.min(index, images.length - 1)];

  // Every way focus can move away from the focused image funnels through here, so the guard is written once.
  // Memoized so the arrow-key effect below can depend on it without re-subscribing on every render
  const leave = useCallback(
    (proceed: () => void) => {
      if (focused && confirmLeave) confirmLeave(focused.id, proceed);
      else proceed();
    },
    [focused, confirmLeave],
  );
  const goTo = useCallback(
    (nextIndex: number) => leave(() => setIndex(nextIndex)),
    [leave],
  );
  const handleClose = () => leave(onClose);
  const recropAllowed = onRecrop && (canRecrop?.(focused?.id) ?? true);
  const template = cropTemplates?.[focused?.id];
  const focusedGuides = template?.guides ?? [];

  const hasOverlay = focusedGuides.length > 0;

  const offAspect =
    template !== undefined &&
    !matchesAspect(focused.width, focused.height, template.aspectRatio);

  const overlayFit =
    template !== undefined && focused.width > 0 && focused.height > 0
      ? {
          templateAspect: template.aspectRatio,
          imageAspect: focused.width / focused.height,
        }
      : undefined;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
  const editor = renderEditor?.(focused);

  return (
    <Modal show fullscreen onHide={handleClose} dialogClassName="ImageLightbox">
      <Modal.Body onClick={closeOnBackgroundClick}>
        <div
          className={cx("ImageLightbox-main", {
            "ImageLightbox-main-editing": !!editor,
          })}
        >
          {cropEditor ?? (
            <>
              {editor && (
                <div
                  className="ImageLightbox-editor"
                  role="group"
                  aria-label={editorLabel}
                >
                  {editor}
                </div>
              )}
              <div className="ImageLightbox-picture">
                <Image
                  images={focused}
                  key={focused.url}
                  size="full"
                  overlay={
                    <>
                      {!editor && <Labels labels={labels?.[focused.id]} />}
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
                  {focused.organized && (
                    <>
                      {" "}
                      &middot;{" "}
                      <Tooltip
                        text="Organized: a moderator has signed off on the labels and date"
                        placement="top"
                      >
                        <span
                          className="ImageLightbox-organized"
                          role="img"
                          aria-label="Organized"
                        >
                          <Icon icon={faCircleCheck} />
                        </span>
                      </Tooltip>
                    </>
                  )}
                  {focused.originalImage && (
                    <>
                      {" "}
                      &middot;{" "}
                      <a
                        className="ImageLightbox-original-link"
                        href={focused.originalImage.url}
                        target="_blank"
                        rel="noreferrer noopener"
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
                        onClick={toggleGuides}
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
                {image.organized && (
                  <span
                    className="ImageLightbox-thumb-organized"
                    title="Organized"
                  >
                    <Icon icon={faCircleCheck} />
                  </span>
                )}
                <span className="ImageLightbox-thumb-footer">
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
