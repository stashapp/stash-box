import { FC } from "react";
import { Link } from "react-router-dom";
import { Row } from "react-bootstrap";
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
      <b className="col-2 text-end">{name}</b>
      {showDiff && (
        <span className="col-5 ms-auto mt-2" key={oldEntity?.name}>
          <div className="EditDiff bg-danger">{getValue(oldEntity)}</div>
        </span>
      )}
      <span className="col-5 mt-2" key={newEntity?.name}>
        <div className={cx("EditDiff", { "bg-success": showDiff })}>
          {getValue(newEntity)}
        </div>
      </span>
    </Row>
  );
};

export default LinkedChangeRow;
