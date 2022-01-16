import { FC } from "react";
import { Col, Row } from "react-bootstrap";
import cx from "classnames";

export interface ChangeRowProps {
  name?: string;
  newValue?: string | number | null;
  oldValue?: string | number | null;
  showDiff?: boolean;
}

const ChangeRow: FC<ChangeRowProps> = ({
  name,
  newValue,
  oldValue,
  showDiff = false,
}) =>
  name && (newValue || oldValue) ? (
    <Row className="mb-2">
      <b className="col-2 text-end pt-1">{name}</b>
      {showDiff && (
        <Col xs={5}>
          <div className="EditDiff bg-danger">{oldValue}</div>
        </Col>
      )}
      <Col xs={showDiff ? 5 : 10}>
        <div className={cx("EditDiff", { "bg-success": showDiff })}>
          {newValue}
        </div>
      </Col>
    </Row>
  ) : (
    <></>
  );

export default ChangeRow;
