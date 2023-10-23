import { FC } from "react";
import { Col, Row } from "react-bootstrap";

type Image = {
  height?: number | undefined;
  id: string;
  url: string;
  width?: number | undefined;
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
  return (
    <>
      {(images ?? []).map((image, i) =>
        image === null ? (
          <img className={CLASSNAME_IMAGE} alt="Deleted" key={`deleted-${i}`} />
        ) : (
          <div key={image.id}>
            <img src={image.url} className={CLASSNAME_IMAGE} alt="" />
            <div className={"text-center"}>
              {image.width} x {image.height}
            </div>
          </div>
        )
      )}
    </>
  );
};

const ImageChangeRow: FC<ImageChangeRowProps> = ({
  newImages,
  oldImages,
  showDiff = false,
}) =>
  (newImages ?? []).length > 0 || (oldImages ?? []).length > 0 ? (
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
  ) : (
    <></>
  );

export default ImageChangeRow;
