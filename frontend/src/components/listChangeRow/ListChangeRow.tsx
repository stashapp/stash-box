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
const ListChangeRow = <T extends unknown>(
  props: PropsWithChildren<ListChangeRowProps<T>>
) =>
  (props.added ?? []).length > 0 || (props.removed ?? []).length > 0 ? (
    <Row className={CLASSNAME}>
      <b className="col-2 text-end">{props.name}</b>
      {props.showDiff && (
        <Col xs={5}>
          {(props.removed ?? []).length > 0 && (
            <>
              <h6>Removed</h6>
              <div className={CLASSNAME}>
                <ul>
                  {(props.removed ?? []).map((u) => (
                    <li key={props.getKey(u)}>{props.renderItem(u)}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </Col>
      )}
      <Col xs={5}>
        {(props.added ?? []).length > 0 && (
          <>
            {props.showDiff && <h6>Added</h6>}
            <div className={CLASSNAME}>
              <ul>
                {(props.added ?? []).map((u) => (
                  <li key={props.getKey(u)}>{props.renderItem(u)}</li>
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
