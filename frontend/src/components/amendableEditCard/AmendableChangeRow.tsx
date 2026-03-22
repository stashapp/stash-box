import type { FC } from "react";
import { Col, Row, Button } from "react-bootstrap";
import { faXmark, faUndo } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

import { Icon } from "src/components/fragments";

export interface AmendableChangeRowProps {
  name?: string;
  field: string;
  newValue?: string | number | null;
  oldValue?: string | number | null;
  showDiff?: boolean;
  isRemoved?: boolean;
  onRemove?: (field: string) => void;
  onRestore?: (field: string) => void;
}

const AmendableChangeRow: FC<AmendableChangeRowProps> = ({
  name,
  field,
  newValue,
  oldValue,
  showDiff = false,
  isRemoved = false,
  onRemove,
  onRestore,
}) =>
  name && (newValue || oldValue) ? (
    <Row
      className={cx("mb-2", {
        "opacity-50 text-decoration-line-through": isRemoved,
      })}
    >
      <b className="col-2 text-end pt-1">{name}</b>
      {showDiff && (
        <Col xs={4}>
          <div className="EditDiff bg-danger">{oldValue}</div>
        </Col>
      )}
      <Col xs={showDiff ? 4 : 8}>
        <div className={cx("EditDiff", { "bg-success": showDiff })}>
          {newValue}
        </div>
      </Col>
      <Col xs={2} className="text-end">
        {onRemove && !isRemoved && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onRemove(field)}
            title={`Remove ${name} change`}
          >
            <Icon icon={faXmark} />
          </Button>
        )}
        {isRemoved && onRestore && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onRestore(field)}
            title={`Restore ${name} change`}
          >
            <Icon icon={faUndo} />
          </Button>
        )}
      </Col>
    </Row>
  ) : null;

export default AmendableChangeRow;
