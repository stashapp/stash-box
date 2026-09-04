import type { FC } from "react";
import { Col, Row } from "react-bootstrap";
import type { CropTemplateInfo } from "src/components/cropFrame";
import ImageComponent from "src/components/image";
import { useImageTypeVocabulary } from "src/hooks";

type Image = {
  height: number;
  id: string;
  url: string;
  width: number;
  types?: string[];
  date?: string | null;
  /**
   * Present when this image is a crop of a wider retained original -- from
   * the upload flow's own cropper or a later re-crop, either way. A manual
   * remove-and-add of an already-externally-cropped file has no original to
   * retain, so this is what tells the two apart in an edit's diff.
   */
  originalImage?: { url: string } | null;
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
  cropTemplates: Record<string, CropTemplateInfo>;
}> = ({ image, gallery, labels, cropTemplates }) => (
  <div className={CLASSNAME_IMAGE}>
    <ImageComponent
      images={image}
      alt=""
      size="full"
      lightboxImages={gallery}
      lightboxProps={{ labels, cropTemplates }}
    />
    <div className="text-center">
      {image.width} x {image.height}
    </div>
    {image.originalImage && (
      <div className="text-center text-muted">
        <a
          href={image.originalImage.url}
          target="_blank"
          rel="noreferrer"
          title="This image has been cropped; opens the uncropped original in a new tab"
        >
          View original
        </a>
      </div>
    )}
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
  const { typeName, templateFor } = useImageTypeVocabulary();

  const added = (newImages ?? []).filter((image) => image !== null);
  const removed = (oldImages ?? []).filter((image) => image !== null);
  const deletedCount = (oldImages ?? []).length - removed.length;

  const gallery = [...added, ...removed];

  const labels: Record<string, string[]> = {};
  const cropTemplates: Record<string, CropTemplateInfo> = {};
  for (const image of gallery) {
    const types = image.types ?? [];
    labels[image.id] = types.map(typeName);
    const template = templateFor(types);
    if (template) cropTemplates[image.id] = template;
  }

  const cell = (image: Image) => (
    <ImageCell
      key={image.id}
      image={image}
      gallery={gallery}
      labels={labels}
      cropTemplates={cropTemplates}
    />
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
