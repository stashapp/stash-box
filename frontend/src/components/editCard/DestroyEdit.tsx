import React from "react";
import { Link } from "react-router-dom";

import { Edits_queryEdits_edits_target as Target } from "src/definitions/Edits";
import { isTagTarget } from "./utils";

interface DestroyProps {
  target?: Target | null;
}

const DestroyEdit: React.FC<DestroyProps> = ({ target }) => {
  if (isTagTarget(target)) {
    return (
      <div>
        <div className="row">
          <b className="col-2 text-right">Deleting: </b>
          <Link to={`/tags/${target?.name}`}>
            <span className="text-capitalize bg-danger">
              {target?.name.toLowerCase()}
            </span>
          </Link>
        </div>
      </div>
    );
  }
  return null;
};

export default DestroyEdit;
