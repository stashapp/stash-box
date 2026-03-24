import type { FC } from "react";
import { Col, Row, Button } from "react-bootstrap";
import { faXmark, faUndo } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

import { SiteLink, Icon } from "src/components/fragments";
import type { URL } from "src/components/urlChangeRow";
import { useAmendment } from "./AmendmentContext";

const CLASSNAME = "URLChangeRow";

interface AmendableURLChangeRowProps {
  field: string;
  newURLs?: URL[] | null;
  oldURLs?: URL[] | null;
  showDiff?: boolean;
}

const AmendableURLChangeRow: FC<AmendableURLChangeRowProps> = ({
  field,
  newURLs,
  oldURLs,
  showDiff,
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

  if ((newURLs ?? []).length === 0 && (oldURLs ?? []).length === 0) return null;

  return (
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
                        {!isRemoved && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="ms-2"
                            onClick={() => clearRemovedItem(field, index)}
                            title="Remove this URL change from the edit"
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
                      {!isRemoved && (
                        <Button
                          variant="danger"
                          size="sm"
                          className="ms-2"
                          onClick={() => clearAddedItem(field, index)}
                          title="Remove this URL from the edit"
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
  );
};

export default AmendableURLChangeRow;
