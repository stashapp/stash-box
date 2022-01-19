import { PropsWithChildren } from "react";

import { Col, Row } from "react-bootstrap";

interface ListChangeRowProps<T> {
  added?: T[] | null;
  removed?: T[] | null;
  renderItem: (o: T) => JSX.Element | undefined;
  getKey: (o: T) => string;
  name: string;
  showDiff?: boolean;
}

const CLASSNAME = "ListChangeRow";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const ListChangeRow = <T extends unknown>({
  added,
  removed,
  name,
  getKey,
  renderItem,
  showDiff,
}: PropsWithChildren<ListChangeRowProps<T>>) =>
  (added ?? []).length > 0 || (removed ?? []).length > 0 ? (
    <Row className={CLASSNAME}>
      <b className="col-2 text-end">{name}</b>
      {showDiff && (
        <Col xs={5}>
          {(removed ?? []).length > 0 && (
            <>
              <h6>Removed</h6>
              <div className={CLASSNAME}>
                <ul>
                  {(removed ?? []).map((u) => (
                    <li key={getKey(u)}>{renderItem(u)}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </Col>
      )}
      <Col xs={showDiff ? 5 : 10}>
        {(added ?? []).length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <div className={CLASSNAME}>
              <ul>
                {(added ?? []).map((u) => (
                  <li key={getKey(u)}>{renderItem(u)}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </Col>
    </Row>
  ) : (
    <></>
  );

export default ListChangeRow;
