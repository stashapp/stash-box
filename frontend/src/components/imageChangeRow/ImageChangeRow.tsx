import type { FC, ReactNode } from "react";
import { Col, Row } from "react-bootstrap";
import type { Labelling } from "src/components/editImages";
import ImageLabels from "src/components/editImages/ImageLabels";
import ImageComponent from "src/components/image";
import type { ImageTypeEnum } from "src/graphql";
import { useImageTypeNames } from "src/hooks";

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

export interface ImageChangeRowProps {
  newImages?: (Image | null)[] | null;
  oldImages?: (Image | null)[] | null;
  showDiff?: boolean;
}

const ImageCell: FC<{
  image: Image;
  gallery: Image[];
  labels: Record<string, string[]>;
  renderEditor: (image: { id: string }) => ReactNode;
}> = ({ image, gallery, labels, renderEditor }) => (
  <div className={CLASSNAME_IMAGE}>
    <ImageComponent
      images={image}
      alt=""
      size="full"
      lightboxImages={gallery}
      labels={labels}
      renderEditor={renderEditor}
      editorLabel="Image classification and date"
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
  const { groups, typeName } = useImageTypeNames({ includeDisabled: true });

  const added = (newImages ?? []).filter((image) => image !== null);
  const removed = (oldImages ?? []).filter((image) => image !== null);
  const deletedCount = (oldImages ?? []).length - removed.length;

  const gallery = [...added, ...removed];

  const labels: Record<string, string[]> = {};
  const labelling: Record<string, Labelling> = {};
  for (const image of gallery) {
    labels[image.id] = (image.types ?? []).map(typeName);
    labelling[image.id] = {
      types: (image.types ?? []) as ImageTypeEnum[],
      date: image.date ?? null,
    };
  }

  const renderLabelling = (image: { id: string }) => {
    const value = labelling[image.id];
    if (!value || (value.types.length === 0 && !value.date)) return null;
    return (
      <ImageLabels
        groups={groups}
        value={value}
        onChange={() => undefined}
        labelsDisabled
        dateDisabled
      />
    );
  };

  const cell = (image: Image) => (
    <ImageCell
      key={image.id}
      image={image}
      gallery={gallery}
      labels={labels}
      renderEditor={renderLabelling}
    />
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
            </>
          )}
        </Col>
      )}
      <Col xs={showDiff ? 5 : 10}>
        {added.length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <div className={CLASSNAME}>{added.map(cell)}</div>
          </>
        )}
      </Col>
    </Row>
  );
};

export default ImageChangeRow;
