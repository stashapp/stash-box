import type { FC } from "react";
import { Link } from "react-router-dom";
import { Col, Row, Button } from "react-bootstrap";
import { faXmark, faUndo } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

import { Icon } from "src/components/fragments";
import { useAmendment } from "./AmendmentContext";

interface Change {
  name: string | null | undefined;
  link: string | null | undefined;
}

interface AmendableLinkedChangeRowProps {
  name: string;
  field: string;
  oldEntity?: Change | null;
  newEntity?: Change | null;
  showDiff?: boolean;
}

const AmendableLinkedChangeRow: FC<AmendableLinkedChangeRowProps> = ({
  name,
  field,
  newEntity,
  oldEntity,
  showDiff = false,
}) => {
  const { state, clearField, restoreField } = useAmendment();
  const isRemoved = state.removedFields.has(field);

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
    <Row
      className={cx("mb-2", {
        "opacity-50 text-decoration-line-through": isRemoved,
      })}
    >
      <b className="col-2 text-end pt-1">{name}</b>
      {showDiff && (
        <Col xs={4} className="ms-auto" key={oldEntity?.name}>
          <div className="EditDiff bg-danger">{getValue(oldEntity)}</div>
        </Col>
      )}
      <Col xs={showDiff ? 4 : 8} key={newEntity?.name}>
        <div className={cx("EditDiff", { "bg-success": showDiff })}>
          {getValue(newEntity)}
        </div>
      </Col>
      <Col xs={2} className="text-end">
        {!isRemoved && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => clearField(field)}
            title={`Remove ${name} change`}
          >
            <Icon icon={faXmark} />
          </Button>
        )}
        {isRemoved && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => restoreField(field)}
            title={`Restore ${name} change`}
          >
            <Icon icon={faUndo} />
          </Button>
        )}
      </Col>
    </Row>
  );
};

export default AmendableLinkedChangeRow;
