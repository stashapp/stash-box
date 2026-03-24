import type { PropsWithChildren } from "react";
import { Col, Row, Button } from "react-bootstrap";
import { faXmark, faUndo } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

import { Icon } from "src/components/fragments";
import { useAmendment } from "./AmendmentContext";

interface AmendableListChangeRowProps<T> {
  added?: T[] | null;
  removed?: T[] | null;
  renderItem: (o: T) => JSX.Element | undefined;
  getKey: (o: T) => string;
  name: string;
  field: string;
  showDiff?: boolean;
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
}: PropsWithChildren<AmendableListChangeRowProps<T>>) => {
  const {
    state,
    clearAddedItem,
    clearRemovedItem,
    restoreAddedItem,
    restoreRemovedItem,
  } = useAmendment();

  const removedAddedIndices = state.removedAddedItems.get(field);
  const removedRemovedIndices = state.removedRemovedItems.get(field);

  if ((added ?? []).length === 0 && (removed ?? []).length === 0) return null;

  return (
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
                        {!isRemoved && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="ms-2"
                            onClick={() => clearRemovedItem(field, index)}
                            title="Remove this item from the edit"
                          >
                            <Icon icon={faXmark} />
                          </Button>
                        )}
                        {isRemoved && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="ms-2"
                            onClick={() => restoreRemovedItem(field, index)}
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
                      {!isRemoved && (
                        <Button
                          variant="danger"
                          size="sm"
                          className="ms-2"
                          onClick={() => clearAddedItem(field, index)}
                          title="Remove this item from the edit"
                        >
                          <Icon icon={faXmark} />
                        </Button>
                      )}
                      {isRemoved && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="ms-2"
                          onClick={() => restoreAddedItem(field, index)}
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
  );
};

export default AmendableListChangeRow;
