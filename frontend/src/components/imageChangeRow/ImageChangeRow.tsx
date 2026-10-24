import type { FC } from "react";
import { Col, Row } from "react-bootstrap";
import ImageComponent from "src/components/image";

type Image = {
  height: number;
  id: string;
  url: string;
  width: number;
};

const CLASSNAME = "ImageChangeRow";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;

export interface ImageChangeRowProps {
  newImages?: (Image | null)[] | null;
  oldImages?: (Image | null)[] | null;
  showDiff?: boolean;
}

const ImageCell: FC<{
  image: Image;
  gallery: Image[];
}> = ({ image, gallery }) => (
  <div className={CLASSNAME_IMAGE}>
    <ImageComponent
      images={image}
      alt=""
      size="full"
      lightboxImages={gallery}
      categorization="labels"
    />
    <div className="text-center">
      {image.width} x {image.height}
    </div>
  </div>
);

const ImageChangeRow: FC<ImageChangeRowProps> = ({
  newImages,
  oldImages,
  showDiff = false,
}) => {
  const added = (newImages ?? []).filter((image) => image !== null);
  const removed = (oldImages ?? []).filter((image) => image !== null);
  const deletedCount = (oldImages ?? []).length - removed.length;

  const cell = (image: Image, gallery: Image[]) => (
    <ImageCell key={image.id} image={image} gallery={gallery} />
  );

  if (added.length === 0 && removed.length === 0 && deletedCount === 0)
    return null;

  return (
    <Row className={CLASSNAME}>
      <b className="col-2 text-end">Images</b>
      {showDiff && (
        <Col xs={5}>
          {(removed.length > 0 || deletedCount > 0) && (
            <>
              <h6>Removed</h6>
              <div className={CLASSNAME}>
                {removed.map((image) => cell(image, removed))}
                {Array.from({ length: deletedCount }, (_, i) => (
                  <img
                    className={CLASSNAME_IMAGE}
                    alt="Deleted"
                    // biome-ignore lint/suspicious/noArrayIndexKey: the image is gone, there is no other key
                    key={`deleted-${i}`}
                  />
                ))}
              </div>
            </>
          )}
        </Col>
      )}
      <Col xs={showDiff ? 5 : 10}>
        {added.length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <div className={CLASSNAME}>
              {added.map((image) => cell(image, added))}
            </div>
          </>
        )}
      </Col>
    </Row>
  );
};

export default ImageChangeRow;
