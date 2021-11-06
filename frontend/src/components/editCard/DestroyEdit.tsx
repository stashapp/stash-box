import { FC } from "react";
import { Link } from "react-router-dom";
import { Col, Row } from "react-bootstrap";

import { Edits_queryEdits_edits_target as Target } from "src/graphql/definitions/Edits";
import {
  isValidEditTarget,
  getEditTargetRoute,
  getEditTargetName,
} from "src/utils";

interface DestroyProps {
  target?: Target | null;
}

const DestroyEdit: FC<DestroyProps> = ({ target }) => {
  if (!isValidEditTarget(target)) return <span>Unsupported target type</span>;

  const route = getEditTargetRoute(target);

  return (
    <Row>
      <b className="col-2 text-end">Deleting: </b>
      <Col>
        <Link to={route}>
          <span className="EditDiff bg-danger">
            {getEditTargetName(target)}
          </span>
        </Link>
      </Col>
    </Row>
  );
};

export default DestroyEdit;
