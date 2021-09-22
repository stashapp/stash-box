import React from "react";
import { Row } from "react-bootstrap";

import { ImageFragment as Image } from "src/graphql/definitions/ImageFragment";

const CLASSNAME = "ImageChangeRow";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;

export interface ImageChangeRowProps {
  newImages?: (Pick<Image, "id" | "url"> | null)[] | null;
  oldImages?: (Pick<Image, "id" | "url"> | null)[] | null;
  showDiff?: boolean;
}

const Images: React.FC<{
  images: (Pick<Image, "id" | "url"> | null)[] | null | undefined;
}> = ({ images }) => (
  <>
    {(images ?? []).map((image) =>
      image === null ? (
        <img className={CLASSNAME_IMAGE} alt="Deleted" />
      ) : (
        <img src={image.url} className={CLASSNAME_IMAGE} alt="" />
      )
    )}
  </>
);

const ImageChangeRow: React.FC<ImageChangeRowProps> = ({
  newImages,
  oldImages,
  showDiff = false,
}) =>
  (newImages ?? []).length > 0 || (oldImages ?? []).length > 0 ? (
    <Row className={CLASSNAME}>
      <b className="col-2 text-right">Images</b>
      {showDiff && (
        <div className="col-5">
          {(oldImages ?? []).length > 0 && (
            <>
              <h6>Removed</h6>
              <div className={CLASSNAME}>
                <Images images={oldImages} />
              </div>
            </>
          )}
        </div>
      )}
      <span className="col-5">
        {(newImages ?? []).length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <div className={CLASSNAME}>
              <Images images={newImages} />
            </div>
          </>
        )}
      </span>
    </Row>
  ) : (
    <></>
  );

export default ImageChangeRow;
