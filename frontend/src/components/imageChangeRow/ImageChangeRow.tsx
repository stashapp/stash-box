import type { FC, ReactNode } from "react";
import { Col, Row } from "react-bootstrap";
import {
  type CropSizeVerdict,
  CropSizeWarning,
  type CropTemplateInfo,
  judgedCropSizeVerdict,
} from "src/components/cropFrame";
import type { Labelling } from "src/components/editImages";
import ImageLabels from "src/components/editImages/ImageLabels";
import { CroppedIndicator } from "src/components/fragments";
import ImageComponent from "src/components/image";
import type { ImageTypeEnum } from "src/graphql";
import { useImageTypeVocabulary } from "src/hooks";

type Image = {
  height: number;
  id: string;
  url: string;
  width: number;
  types?: string[];
  date?: string | null;
  originalImage?: { url: string; width?: number; height?: number } | null;
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
  cropTemplates: Record<string, CropTemplateInfo>;
  renderEditor: (image: { id: string }) => ReactNode;
  sizeVerdict?: CropSizeVerdict;
}> = ({ image, gallery, labels, cropTemplates, renderEditor, sizeVerdict }) => (
  <div className={CLASSNAME_IMAGE}>
    <ImageComponent
      images={image}
      alt=""
      size="full"
      lightboxImages={gallery}
      lightboxProps={{
        labels,
        cropTemplates,
        renderEditor,
        editorLabel: "Image classification and date",
      }}
    />
    <div className="text-center">
      {image.width} x {image.height}
    </div>
    <CroppedIndicator original={image.originalImage} />
    <CropSizeWarning verdict={sizeVerdict} />
  </div>
);

const ImageChangeRow: FC<ImageChangeRowProps> = ({
  newImages,
  oldImages,
  showDiff = false,
}) => {
  const { groups, typeName, templateFor } = useImageTypeVocabulary({
    includeDisabled: true,
  });

  const added = (newImages ?? []).filter((image) => image !== null);
  const removed = (oldImages ?? []).filter((image) => image !== null);
  const deletedCount = (oldImages ?? []).length - removed.length;

  const gallery = [...added, ...removed];

  const labels: Record<string, string[]> = {};
  const cropTemplates: Record<string, CropTemplateInfo> = {};
  const labelling: Record<string, Labelling> = {};
  for (const image of gallery) {
    const types = image.types ?? [];
    labels[image.id] = types.map(typeName);
    const template = templateFor(types);
    if (template) cropTemplates[image.id] = template;
    labelling[image.id] = {
      types: types as ImageTypeEnum[],
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

  const cell = (image: Image) => (
    <ImageCell
      key={image.id}
      image={image}
      gallery={gallery}
      labels={labels}
      cropTemplates={cropTemplates}
      renderEditor={renderLabelling}
      sizeVerdict={verdictFor(image)}
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
                {removed.map((image) => cell(image))}
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
            <div className={CLASSNAME}>{added.map((image) => cell(image))}</div>
          </>
        )}
      </Col>
    </Row>
  );
};

export default ImageChangeRow;
