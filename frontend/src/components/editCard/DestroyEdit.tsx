import React from "react";
import { Link } from "react-router-dom";

import { Edits_queryEdits_edits_target as Target } from "src/graphql/definitions/Edits";
import {
  isValidEditTarget,
  getEditTargetRoute,
} from "src/utils";

interface DestroyProps {
  target?: Target | null;
}

const DestroyEdit: React.FC<DestroyProps> = ({ target }) => {
  if (!isValidEditTarget(target))
    return <span>Unsupported target type</span>;

  const route = getEditTargetRoute(target); 

  return (
    <div>
      <div className="row">
        <b className="col-2 text-right">Deleting: </b>
        <Link to={route}>
          <span className="EditDiff bg-danger">{target?.name}</span>
        </Link>
      </div>
    </div>
  );
};

export default DestroyEdit;
