import {
  faArrowLeft,
  faArrowRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import {
  type CSSProperties,
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button, Modal, Nav } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  type CropTemplateInfo,
  FittedOverlay,
  matchesAspect,
} from "src/components/cropFrame";
import { Icon } from "src/components/fragments";
import { useCropGuides, useImageCategorizationFragment } from "src/hooks";
import { imageHref } from "src/utils/route";
import Image from "./Image";
import ImageCategorization, {
  type CategorizationEditor,
} from "./ImageCategorization";
import ImageOrganizedIndicator from "./ImageOrganizedIndicator";
import ImageTags from "./ImageTags";
import type { ImageCategorization as Categorization } from "./types";

type LightboxImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  originalImage?: { url: string } | null;
  organized?: boolean;
  types?: readonly string[];
};

interface ImageLightboxProps {
  images: LightboxImage[];
  defaultIndex?: number;
  onClose: () => void;
  showCategorization?: boolean;
  showTags?: boolean;
  templateFor?: (types: readonly string[]) => CropTemplateInfo | undefined;
  /** Absent hides the re-crop entrypoints entirely */
  onRecrop?: (
    image: LightboxImage,
    categorization: { types: readonly string[]; date?: string | null },
    consume: () => void,
  ) => void;
  canRecrop?: (
    imageId: string,
    categorization: { organized: boolean; types: readonly string[] },
  ) => boolean;
  renderCropEditor?: (image: LightboxImage) => ReactNode;
}

const ImageLightbox: FC<ImageLightboxProps> = ({
  images,
  defaultIndex = 0,
  onClose,
  showCategorization = false,
  showTags = showCategorization,
  templateFor,
  onRecrop,
  canRecrop,
  renderCropEditor,
}) => {
  const categorizationEditor = useRef<CategorizationEditor>(null);
  const [index, setIndex] = useState(defaultIndex);
  const [sideTab, setSideTab] = useState<"images" | "categorization">("images");
  const navigate = useNavigate();
  const { showGuides, toggleGuides } = useCropGuides();

  const focused = images[Math.min(index, images.length - 1)];

  // Labels picked here but not saved yet, so the gallery can act on them.
  // The editor is keyed by image and reports null as it goes, so switching
  // image or tab clears this without the lightbox tracking either
  const [pending, setPending] = useState<Categorization | null>(null);

  // Saved labels come from the cache rather than the caller's snapshot, which
  // goes stale the moment a label is saved from in here
  const saved = useImageCategorizationFragment(focused?.id ?? "");
  const categorization = {
    types: pending?.types ?? saved?.types ?? focused?.types ?? [],
    date: pending?.date ?? saved?.date ?? null,
  };
  const organized = saved?.organized ?? focused?.organized ?? false;

  // Every way focus can move away from the focused image funnels through here, so the guard is written once
  const leave = useCallback((proceed: () => void) => {
    if (categorizationEditor.current)
      categorizationEditor.current.confirmLeave(proceed);
    else proceed();
  }, []);
  const goTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex !== index) leave(() => setIndex(nextIndex));
    },
    [leave, index],
  );
  const handleClose = () => leave(onClose);

  const recropAllowed =
    onRecrop &&
    (canRecrop?.(focused?.id, { organized, types: categorization.types }) ??
      true);
  const template = templateFor?.(categorization.types);
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

  const thumbnails = (
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
          <ImageOrganizedIndicator
            imageId={image.id}
            organized={image.organized}
          />
          <span className="ImageLightbox-thumb-footer">
            {showTags && <ImageTags imageId={image.id} />}
            <span className="ImageLightbox-thumb-dims">
              {image.width}&times;{image.height}
            </span>
          </span>
        </button>
      ))}
    </div>
  );

  const cropEditor = renderCropEditor?.(focused);

  return (
    <Modal show fullscreen onHide={handleClose} dialogClassName="ImageLightbox">
      <Modal.Body onClick={closeOnBackgroundClick}>
        <div className="ImageLightbox-main">
          {cropEditor ?? (
            <>
              <Image
                images={focused}
                key={focused.url}
                size="full"
                showTags={showTags && sideTab !== "categorization"}
                overlay={
                  showGuides && hasOverlay && overlayFit ? (
                    <FittedOverlay
                      guides={focusedGuides}
                      templateAspect={overlayFit.templateAspect}
                      imageAspect={overlayFit.imageAspect}
                    />
                  ) : undefined
                }
              />
              <div className="ImageLightbox-caption">
                {images.length > 1 && (
                  <>
                    {index + 1}/{images.length} &middot;{" "}
                  </>
                )}
                <span>
                  {focused.width}&times;{focused.height}
                </span>{" "}
                &middot;{" "}
                <Link
                  className="ImageLightbox-details"
                  to={imageHref(focused)}
                  onClick={(event) => {
                    if (
                      event.ctrlKey ||
                      event.metaKey ||
                      event.shiftKey ||
                      event.altKey
                    )
                      return;
                    event.preventDefault();
                    leave(() => navigate(imageHref(focused)));
                  }}
                >
                  Details
                </Link>
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
                      onClick={() =>
                        onRecrop?.(focused, categorization, () =>
                          categorizationEditor.current?.reset(),
                        )
                      }
                    >
                      Re-crop
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        {showCategorization ? (
          <div className="ImageLightbox-side">
            <Nav
              variant="tabs"
              activeKey={sideTab}
              onSelect={(key) =>
                key &&
                key !== sideTab &&
                leave(() => setSideTab(key as "images" | "categorization"))
              }
            >
              <Nav.Item>
                <Nav.Link eventKey="images">Images</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="categorization">Categorization</Nav.Link>
              </Nav.Item>
            </Nav>
            {sideTab === "categorization" ? (
              <>
                <div className="ImageLightbox-editor-navigation">
                  <Button
                    variant="link"
                    className="minimal"
                    aria-label="Previous image"
                    disabled={index === 0}
                    onClick={() => goTo(index - 1)}
                  >
                    <Icon icon={faArrowLeft} />
                  </Button>
                  <span>
                    {index + 1} of {images.length}
                  </span>
                  <Button
                    variant="link"
                    className="minimal"
                    aria-label="Next image"
                    disabled={index === images.length - 1}
                    onClick={() => goTo(index + 1)}
                  >
                    <Icon icon={faArrowRight} />
                  </Button>
                </div>
                <div
                  className="ImageLightbox-editor"
                  role="group"
                  aria-label="Image classification and date"
                >
                  <ImageCategorization
                    key={focused.id}
                    ref={categorizationEditor}
                    imageId={focused.id}
                    onPendingChange={setPending}
                  />
                </div>
              </>
            ) : (
              thumbnails
            )}
          </div>
        ) : (
          images.length > 1 && thumbnails
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
