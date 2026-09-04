import type { FC } from "react";
import { Col, Row } from "react-bootstrap";
import ImageComponent from "src/components/image";
import { useImageTypeNames } from "src/hooks/useImageTypeNames";

type Image = {
  height: number;
  id: string;
  url: string;
  width: number;
  types?: string[];
  date?: string | null;
};

const CLASSNAME = "ImageChangeRow";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_GROUP = `${CLASSNAME}-group`;

export interface ImageChangeRowProps {
  newImages?: (Image | null)[] | null;
  oldImages?: (Image | null)[] | null;
  showDiff?: boolean;
}

const ImageCell: FC<{
  image: Image;
  gallery: Image[];
  labels: Record<string, string[]>;
}> = ({ image, gallery, labels }) => (
  <div className={CLASSNAME_IMAGE}>
    <ImageComponent
      images={image}
      alt=""
      size="full"
      lightboxImages={gallery}
      labels={labels}
    />
    <div className="text-center">
      {image.width} x {image.height}
    </div>
  </div>
);

/**
 * The images this edit adds or removes, in one row. Labels and dates are not
 * part of the diff -- they are a property of the image itself, set through
 * imageUpdate rather than through this edit -- so there is nothing to show as
 * "relabelled" here, only attachment
 */
const ImageChangeRow: FC<ImageChangeRowProps> = ({
  newImages,
  oldImages,
  showDiff = false,
}) => {
  const { typeName } = useImageTypeNames();

  const added = (newImages ?? []).filter((image) => image !== null);
  const removed = (oldImages ?? []).filter((image) => image !== null);
  const deletedCount = (oldImages ?? []).length - removed.length;

  const gallery = [...added, ...removed];

  const labels: Record<string, string[]> = {};
  for (const image of gallery) {
    labels[image.id] = (image.types ?? []).map(typeName);
  }

  const cell = (image: Image) => (
    <ImageCell key={image.id} image={image} gallery={gallery} labels={labels} />
  );

  if (added.length === 0 && removed.length === 0 && deletedCount === 0)
    return null;

  return (
    <Row className={CLASSNAME}>
      <b className="col-2 text-end">Images</b>
      <Col xs={10}>
        {showDiff && (removed.length > 0 || deletedCount > 0) && (
          <div className={CLASSNAME_GROUP}>
            <h6>Removed</h6>
            <div className={CLASSNAME}>
              {removed.map(cell)}
              {Array.from({ length: deletedCount }, (_, i) => (
                <img
                  className={CLASSNAME_IMAGE}
                  alt="Deleted"
                  // biome-ignore lint/suspicious/noArrayIndexKey: the image is gone, there is no other key
                  key={`deleted-${i}`}
                />
              ))}
            </div>
          </div>
        )}

        {added.length > 0 && (
          <div className={CLASSNAME_GROUP}>
            {showDiff && <h6>Added</h6>}
            <div className={CLASSNAME}>{added.map(cell)}</div>
          </div>
        )}
      </Col>
    </Row>
  );
};

export default ImageChangeRow;
