import type { PropsWithChildren } from "react";
import { Col, Row, Button } from "react-bootstrap";
import { faXmark, faUndo } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

import { Icon } from "src/components/fragments";

interface AmendableListChangeRowProps<T> {
  added?: T[] | null;
  removed?: T[] | null;
  renderItem: (o: T) => JSX.Element | undefined;
  getKey: (o: T) => string;
  name: string;
  field: string;
  showDiff?: boolean;
  removedAddedIndices?: Set<number>;
  removedRemovedIndices?: Set<number>;
  onRemoveAddedItem?: (field: string, index: number) => void;
  onRemoveRemovedItem?: (field: string, index: number) => void;
  onRestoreAddedItem?: (field: string, index: number) => void;
  onRestoreRemovedItem?: (field: string, index: number) => void;
}

const CLASSNAME = "ListChangeRow";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const AmendableListChangeRow = <T,>({
  added,
  removed,
  name,
  field,
  getKey,
  renderItem,
  showDiff,
  removedAddedIndices,
  removedRemovedIndices,
  onRemoveAddedItem,
  onRemoveRemovedItem,
  onRestoreAddedItem,
  onRestoreRemovedItem,
}: PropsWithChildren<AmendableListChangeRowProps<T>>) =>
  (added ?? []).length > 0 || (removed ?? []).length > 0 ? (
    <Row className={`${CLASSNAME}-${name}`}>
      <b className="col-2 text-end">{name}</b>
      {showDiff && (
        <Col xs={4}>
          {(removed ?? []).length > 0 && (
            <>
              <h6>Removed</h6>
              <div className={CLASSNAME}>
                <ul>
                  {(removed ?? []).map((u, index) => {
                    const isRemoved = removedRemovedIndices?.has(index);
                    return (
                      <li
                        key={getKey(u)}
                        className={cx("d-flex align-items-center", {
                          "opacity-50 text-decoration-line-through": isRemoved,
                        })}
                      >
                        <span className="flex-grow-1">{renderItem(u)}</span>
                        {onRemoveRemovedItem && !isRemoved && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="ms-2"
                            onClick={() => onRemoveRemovedItem(field, index)}
                            title="Remove this item from the edit"
                          >
                            <Icon icon={faXmark} />
                          </Button>
                        )}
                        {isRemoved && onRestoreRemovedItem && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="ms-2"
                            onClick={() => onRestoreRemovedItem(field, index)}
                            title="Restore this item"
                          >
                            <Icon icon={faUndo} />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </Col>
      )}
      <Col xs={showDiff ? 4 : 8}>
        {(added ?? []).length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <div className={CLASSNAME}>
              <ul>
                {(added ?? []).map((u, index) => {
                  const isRemoved = removedAddedIndices?.has(index);
                  return (
                    <li
                      key={getKey(u)}
                      className={cx("d-flex align-items-center", {
                        "opacity-50 text-decoration-line-through": isRemoved,
                      })}
                    >
                      <span className="flex-grow-1">{renderItem(u)}</span>
                      {onRemoveAddedItem && !isRemoved && (
                        <Button
                          variant="danger"
                          size="sm"
                          className="ms-2"
                          onClick={() => onRemoveAddedItem(field, index)}
                          title="Remove this item from the edit"
                        >
                          <Icon icon={faXmark} />
                        </Button>
                      )}
                      {isRemoved && onRestoreAddedItem && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="ms-2"
                          onClick={() => onRestoreAddedItem(field, index)}
                          title="Restore this item"
                        >
                          <Icon icon={faUndo} />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </Col>
      <Col xs={2} />
    </Row>
  ) : null;

export default AmendableListChangeRow;
