import {
  faArrowLeft,
  faArrowRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import {
  type CSSProperties,
  type FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button, Modal, Nav } from "react-bootstrap";
import { Icon } from "src/components/fragments";
import Image from "./Image";
import ImageCategorization, {
  type CategorizationEditor,
} from "./ImageCategorization";
import ImageOrganizedIndicator from "./ImageOrganizedIndicator";
import ImageTags from "./ImageTags";

type LightboxImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  organized?: boolean;
};

interface ImageLightboxProps {
  images: LightboxImage[];
  defaultIndex?: number;
  onClose: () => void;
  categorization?: boolean | "labels";
}

const ImageLightbox: FC<ImageLightboxProps> = ({
  images,
  defaultIndex = 0,
  onClose,
  categorization,
}) => {
  const categorizationEditor = useRef<CategorizationEditor>(null);
  const [index, setIndex] = useState(defaultIndex);
  const [sideTab, setSideTab] = useState<"images" | "categorization">("images");

  const focused = images[Math.min(index, images.length - 1)];

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
            {categorization && <ImageTags imageId={image.id} />}
            <span className="ImageLightbox-thumb-dims">
              {image.width}&times;{image.height}
            </span>
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <Modal show fullscreen onHide={handleClose} dialogClassName="ImageLightbox">
      <Modal.Body onClick={closeOnBackgroundClick}>
        <div className="ImageLightbox-main">
          <Image
            images={focused}
            key={focused.url}
            size="full"
            showTags={!!categorization && sideTab !== "categorization"}
          />
          <div className="ImageLightbox-caption">
            {images.length > 1 && (
              <>
                {index + 1}/{images.length} &middot;{" "}
              </>
            )}
            <span>
              {focused.width}&times;{focused.height}
            </span>
          </div>
        </div>
        {categorization === true ? (
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
