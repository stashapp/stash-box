import type { FC } from "react";
import { Badge, Col, Row } from "react-bootstrap";
import ImageComponent from "src/components/image";
import { useImageTypeNames } from "src/hooks";

type Image = {
  height: number;
  id: string;
  url: string;
  width: number;
};

const CLASSNAME = "ImageChangeRow";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_GROUP = `${CLASSNAME}-group`;
const CLASSNAME_CHIPS = `${CLASSNAME}-chips`;

export interface ImageAssignmentChange {
  image: Image;
  added_types: string[];
  removed_types: string[];
  date?: string | null;
  date_changed: boolean;
}

export interface ResultingImage {
  image: Image;
  types: string[];
  date?: string | null;
}

export interface ImageChangeRowProps {
  newImages?: (Image | null)[] | null;
  oldImages?: (Image | null)[] | null;
  changes?: ImageAssignmentChange[] | null;
  // The lightbox needs to show the final result
  resulting?: ResultingImage[] | null;
  showDiff?: boolean;
}

const ImageCell: FC<{
  image: Image;
  change?: ImageAssignmentChange;
  gallery: Image[];
  labels: Record<string, string[]>;
  typeName: (key: string) => string;
  typeDescription: (key: string) => string | undefined;
}> = ({ image, change, gallery, labels, typeName, typeDescription }) => (
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

    {change && (
      <div className={CLASSNAME_CHIPS}>
        {change.added_types.map((type) => (
          <Badge
            key={`added-${type}`}
            bg="success"
            title={typeDescription(type)}
          >
            + {typeName(type)}
          </Badge>
        ))}
        {change.removed_types.map((type) => (
          <Badge
            key={`removed-${type}`}
            bg="danger"
            title={typeDescription(type)}
          >
            − {typeName(type)}
          </Badge>
        ))}
        {change.date_changed &&
          (change.date ? (
            <Badge bg="success">Date {change.date}</Badge>
          ) : (
            <Badge bg="danger">Date cleared</Badge>
          ))}
      </div>
    )}
  </div>
);

/**
 * Everything this edit does to an entity's gallery, in one row
 *
 * One cell per image, and every image appears exactly once. Grouped by outcome
 * rather than split into Removed | Added columns, because there are three: an
 * image can be added, removed, or kept and relabelled
 */
const ImageChangeRow: FC<ImageChangeRowProps> = ({
  newImages,
  oldImages,
  changes,
  resulting,
  showDiff = false,
}) => {
  const { typeName, typeDescription } = useImageTypeNames();

  const added = (newImages ?? []).filter((image) => image !== null);
  const removed = (oldImages ?? []).filter((image) => image !== null);
  const deletedCount = (oldImages ?? []).length - removed.length;

  const changeFor = new Map((changes ?? []).map((c) => [c.image.id, c]));
  const addedIDs = new Set(added.map((image) => image.id));
  const removedIDs = new Set(removed.map((image) => image.id));

  // Kept, but relabelled or redated
  const relabelled = (changes ?? [])
    .filter((c) => !addedIDs.has(c.image.id) && !removedIDs.has(c.image.id))
    .map((c) => c.image);

  const gallery = [...added, ...relabelled, ...removed];

  const labels: Record<string, string[]> = {};
  for (const entry of resulting ?? []) {
    labels[entry.image.id] = entry.types.map(typeName);
  }

  const cell = (image: Image) => (
    <ImageCell
      key={image.id}
      image={image}
      change={changeFor.get(image.id)}
      gallery={gallery}
      labels={labels}
      typeName={typeName}
      typeDescription={typeDescription}
    />
  );

  if (
    added.length === 0 &&
    removed.length === 0 &&
    relabelled.length === 0 &&
    deletedCount === 0
  )
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

        {relabelled.length > 0 && (
          <div className={CLASSNAME_GROUP}>
            <h6>Relabelled</h6>
            <div className={CLASSNAME}>{relabelled.map(cell)}</div>
          </div>
        )}
      </Col>
    </Row>
  );
};

export default ImageChangeRow;
