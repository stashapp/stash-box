import type { FC } from "react";
import { Col, Row, Button } from "react-bootstrap";
import { faXmark, faUndo } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

import { SiteLink, Icon } from "src/components/fragments";
import type { URL } from "src/components/urlChangeRow";

const CLASSNAME = "URLChangeRow";

interface AmendableURLChangeRowProps {
  field: string;
  newURLs?: URL[] | null;
  oldURLs?: URL[] | null;
  showDiff?: boolean;
  removedAddedIndices?: Set<number>;
  removedRemovedIndices?: Set<number>;
  onRemoveAddedItem?: (field: string, index: number) => void;
  onRemoveRemovedItem?: (field: string, index: number) => void;
  onRestoreAddedItem?: (field: string, index: number) => void;
  onRestoreRemovedItem?: (field: string, index: number) => void;
}

const AmendableURLChangeRow: FC<AmendableURLChangeRowProps> = ({
  field,
  newURLs,
  oldURLs,
  showDiff,
  removedAddedIndices,
  removedRemovedIndices,
  onRemoveAddedItem,
  onRemoveRemovedItem,
  onRestoreAddedItem,
  onRestoreRemovedItem,
}) =>
  (newURLs ?? []).length > 0 || (oldURLs ?? []).length > 0 ? (
    <Row className={CLASSNAME}>
      <b className="col-2 text-end">Links</b>
      {showDiff && (
        <Col xs={4}>
          {(oldURLs ?? []).length > 0 && (
            <>
              <h6>Removed</h6>
              <div className={CLASSNAME}>
                <ul className="ps-0">
                  {(oldURLs ?? []).map((url, index) => {
                    const isRemoved = removedRemovedIndices?.has(index);
                    return (
                      <li
                        key={url.url}
                        className={cx("d-flex align-items-start", {
                          "opacity-50 text-decoration-line-through": isRemoved,
                        })}
                      >
                        <SiteLink site={url.site} />
                        <a
                          href={url.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="d-inline-block flex-grow-1 text-break"
                        >
                          {url.url}
                        </a>
                        {onRemoveRemovedItem && !isRemoved && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="ms-2"
                            onClick={() => onRemoveRemovedItem(field, index)}
                            title="Remove this URL change from the edit"
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
                            title="Restore this URL"
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
        {(newURLs ?? []).length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <div className={CLASSNAME}>
              <ul className="ps-0">
                {(newURLs ?? []).map((url, index) => {
                  const isRemoved = removedAddedIndices?.has(index);
                  return (
                    <li
                      key={url.url}
                      className={cx("d-flex align-items-start", {
                        "opacity-50 text-decoration-line-through": isRemoved,
                      })}
                    >
                      <SiteLink site={url.site} />
                      <a
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="d-inline-block flex-grow-1 text-break"
                      >
                        {url.url}
                      </a>
                      {onRemoveAddedItem && !isRemoved && (
                        <Button
                          variant="danger"
                          size="sm"
                          className="ms-2"
                          onClick={() => onRemoveAddedItem(field, index)}
                          title="Remove this URL from the edit"
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
                          title="Restore this URL"
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

export default AmendableURLChangeRow;
