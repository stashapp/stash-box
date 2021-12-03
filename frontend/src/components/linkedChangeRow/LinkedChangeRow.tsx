import { FC } from "react";
import { Link } from "react-router-dom";
import { Col, Row } from "react-bootstrap";
import cx from "classnames";

interface Change {
  name: string | null | undefined;
  link: string | null | undefined;
}

interface LinkedChangeRowProps {
  name: string;
  oldEntity?: Change | null;
  newEntity?: Change | null;
  showDiff?: boolean;
}

const LinkedChangeRow: FC<LinkedChangeRowProps> = ({
  name,
  newEntity,
  oldEntity,
  showDiff = false,
}) => {
  function getValue(value: Change | null | undefined) {
    if (!value?.name) {
      return;
    }

    if (!value.link) {
      return value.name;
    }

    return <Link to={value.link}>{value.name}</Link>;
  }

  if (!newEntity?.link && !oldEntity?.link) return null;

  return (
    <Row className="mb-2">
      <b className="col-2 text-end pt-1">{name}</b>
      {showDiff && (
        <Col xs={5} className="ms-auto" key={oldEntity?.name}>
          <div className="EditDiff bg-danger">{getValue(oldEntity)}</div>
        </Col>
      )}
      <Col xs={5} key={newEntity?.name}>
        <div className={cx("EditDiff", { "bg-success": showDiff })}>
          {getValue(newEntity)}
        </div>
      </Col>
    </Row>
  );
};

export default LinkedChangeRow;
