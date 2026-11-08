import type { FC } from "react";
import { Col, Row } from "react-bootstrap";
import {
  type CropSizeVerdict,
  CropSizeWarning,
  judgedCropSizeVerdict,
} from "src/components/cropFrame";
import { CroppedIndicator, DeletedImage } from "src/components/fragments";
import ImageComponent from "src/components/image";
import { useImageTypeVocabulary } from "src/hooks";

type Image = {
  height: number;
  id: string;
  url: string;
  width: number;
  types?: string[];
  originalImage?: { url: string; width?: number; height?: number } | null;
};

const CLASSNAME = "ImageChangeRow";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;

export interface ImageChangeRowProps {
  newImages?: (Image | null)[] | null;
  oldImages?: (Image | null)[] | null;
  showDiff?: boolean;
}

const Images: FC<{
  images: (Image | null)[] | null | undefined;
}> = ({ images }) => {
  const { templateFor } = useImageTypeVocabulary({ includeDisabled: true });
  const lightboxImages = (images ?? []).filter((image) => image !== null);

  const verdictFor = (image: Image): CropSizeVerdict | undefined => {
    const original = image.originalImage;
    return judgedCropSizeVerdict(
      image,
      original?.width && original.height
        ? { width: original.width, height: original.height }
        : undefined,
      image.types ?? [],
    );
  };

  return (
    <>
      {(images ?? []).map((image, i) =>
        image === null ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: Image is deleted, no other key
          <DeletedImage key={`deleted-${i}`} />
        ) : (
          <div key={image.id} className={CLASSNAME_IMAGE}>
            <ImageComponent
              images={image}
              alt=""
              lightboxImages={lightboxImages}
              lightboxProps={{ showTags: true, templateFor }}
              size={300}
              loading="lazy"
            />
            <div className="text-center">
              {image.width} x {image.height}
            </div>
            <CroppedIndicator original={image.originalImage} />
            <CropSizeWarning verdict={verdictFor(image)} />
          </div>
        ),
      )}
    </>
  );
};

const ImageChangeRow: FC<ImageChangeRowProps> = ({
  newImages,
  oldImages,
  showDiff = false,
}) => {
  if (!newImages?.length && !oldImages?.length) {
    return null;
  }

  return (
    <Row className={CLASSNAME}>
      <b className="col-2 text-end">Images</b>
      {showDiff && (
        <Col xs={5}>
          {(oldImages ?? []).length > 0 && (
            <>
              <h6>Removed</h6>
              <div className={CLASSNAME}>
                <Images images={oldImages} />
              </div>
            </>
          )}
        </Col>
      )}
      <Col xs={showDiff ? 5 : 10}>
        {(newImages ?? []).length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <div className={CLASSNAME}>
              <Images images={newImages} />
            </div>
          </>
        )}
      </Col>
    </Row>
  );
};

export default ImageChangeRow;
