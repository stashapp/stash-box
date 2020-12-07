import React from "react";
import { Link } from "react-router-dom";

import { Edits_queryEdits_edits_target as Target } from "src/definitions/Edits";
import { isTag, isPerformer } from "src/utils";

interface DestroyProps {
  target?: Target | null;
}

const DestroyEdit: React.FC<DestroyProps> = ({ target }) => {
  if (isTag(target))
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
  if (isPerformer(target))
    return (
      <div>
        <div className="row">
          <b className="col-2 text-right">Deleting: </b>
          <Link to={`/performers/${target?.id}`}>
            <span className="text-capitalize bg-danger">
              {target?.name.toLowerCase()}
            </span>
          </Link>
        </div>
      </div>
    );
  return null;
};

export default DestroyEdit;
