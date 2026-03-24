import type { FC } from "react";
import { Col, Row, Button } from "react-bootstrap";
import { faXmark, faUndo } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

import ImageComponent from "src/components/image";
import { Icon } from "src/components/fragments";
import { useAmendment } from "./AmendmentContext";

type Image = {
  height: number;
  id: string;
  url: string;
  width: number;
};

const CLASSNAME = "ImageChangeRow";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;

export interface AmendableImageChangeRowProps {
  field: string;
  newImages?: (Image | null)[] | null;
  oldImages?: (Image | null)[] | null;
  showDiff?: boolean;
}

const AmendableImageChangeRow: FC<AmendableImageChangeRowProps> = ({
  field,
  newImages,
  oldImages,
  showDiff = false,
}) => {
  const {
    state,
    clearAddedItem,
    clearRemovedItem,
    restoreAddedItem,
    restoreRemovedItem,
  } = useAmendment();

  const removedAddedIndices = state.removedAddedItems.get(field);
  const removedRemovedIndices = state.removedRemovedItems.get(field);

  if ((newImages ?? []).length === 0 && (oldImages ?? []).length === 0)
    return null;

  return (
    <Row className={CLASSNAME}>
      <b className="col-2 text-end">Images</b>
      {showDiff && (
        <Col xs={4}>
          {(oldImages ?? []).length > 0 && (
            <>
              <h6>Removed</h6>
              <div className={CLASSNAME}>
                {(oldImages ?? []).map((image, index) => {
                  const isRemoved = removedRemovedIndices?.has(index);
                  return (
                    <div
                      key={image?.id ?? `deleted-${index}`}
                      className={cx("d-flex align-items-start mb-2", {
                        "opacity-50": isRemoved,
                      })}
                    >
                      {image === null ? (
                        <img className={CLASSNAME_IMAGE} alt="Deleted" />
                      ) : (
                        <div className={CLASSNAME_IMAGE}>
                          <ImageComponent images={image} alt="" size="full" />
                          <div className="text-center">
                            {image.width} x {image.height}
                          </div>
                        </div>
                      )}
                      <div className="ms-2">
                        {!isRemoved && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => clearRemovedItem(field, index)}
                            title="Remove this image change from the edit"
                          >
                            <Icon icon={faXmark} />
                          </Button>
                        )}
                        {isRemoved && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => restoreRemovedItem(field, index)}
                            title="Restore this image"
                          >
                            <Icon icon={faUndo} />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Col>
      )}
      <Col xs={showDiff ? 4 : 8}>
        {(newImages ?? []).length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <div className={CLASSNAME}>
              {(newImages ?? []).map((image, index) => {
                const isRemoved = removedAddedIndices?.has(index);
                return (
                  <div
                    key={image?.id ?? `deleted-${index}`}
                    className={cx("d-flex align-items-start mb-2", {
                      "opacity-50": isRemoved,
                    })}
                  >
                    {image === null ? (
                      <img className={CLASSNAME_IMAGE} alt="Deleted" />
                    ) : (
                      <div className={CLASSNAME_IMAGE}>
                        <ImageComponent images={image} alt="" size="full" />
                        <div className="text-center">
                          {image.width} x {image.height}
                        </div>
                      </div>
                    )}
                    <div className="ms-2">
                      {!isRemoved && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => clearAddedItem(field, index)}
                          title="Remove this image from the edit"
                        >
                          <Icon icon={faXmark} />
                        </Button>
                      )}
                      {isRemoved && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => restoreAddedItem(field, index)}
                          title="Restore this image"
                        >
                          <Icon icon={faUndo} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Col>
      <Col xs={2} />
    </Row>
  );
};

export default AmendableImageChangeRow;
