import { FC, useState } from "react";
import { Col, Row } from "react-bootstrap";

import { ImageFragment as Image } from "src/graphql/definitions/ImageFragment";

const CLASSNAME = "ImageChangeRow";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;

export interface ImageChangeRowProps {
  newImages?: (Pick<Image, "id" | "url"> | null)[] | null;
  oldImages?: (Pick<Image, "id" | "url"> | null)[] | null;
  showDiff?: boolean;
}

const Images: FC<{
  images: (Pick<Image, "id" | "url"> | null)[] | null | undefined;
}> = ({ images }) => {
  const [imgDimensions, setImgDimensions] = useState<{
    [key: string]: { height: number; width: number };
  } | null>({});

  const onImgLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImgDimensions({
      ...imgDimensions,
      [event.currentTarget.src]: {
        height: event.currentTarget.naturalHeight,
        width: event.currentTarget.naturalWidth,
      },
    });
  };

  return (
    <>
      {(images ?? []).map((image, i) =>
        image === null ? (
          <img className={CLASSNAME_IMAGE} alt="Deleted" key={`deleted-${i}`} />
        ) : (
          <div>
            <img
              src={image.url}
              className={CLASSNAME_IMAGE}
              alt=""
              key={image.id}
              onLoad={onImgLoad}
            />
            <div className={"text-center"}>
              {imgDimensions && imgDimensions[image.url]
                ? String(imgDimensions[image.url].height) +
                  " x " +
                  String(imgDimensions[image.url].width)
                : ""}
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
