import React from "react";
import { Link } from "react-router-dom";

import {
  Edits_queryEdits_edits_target as Target,
  Edits_queryEdits_edits_target_Tag as Tag,
} from "src/definitions/Edits";

interface DestroyProps {
  target?: Target|null;
}

const isTagTarget = (target: Target|null|undefined): target is Tag|undefined => (
  (target as any)?.__typename === "Tag" || target === undefined
);

const DestroyEdit: React.FC<DestroyProps> = ({ target }) => {
  if (isTagTarget(target)) {
    return (
      <div>
        <div className="row">
          <b className="col-2 text-right">Deleting: </b>
          <Link to={`/tags/${target?.name}`}>
            <span className="text-capitalize bg-danger">{ target?.name.toLowerCase() }</span>
          </Link>
        </div>
      </div>
    );
  }
  return null;
}

export default DestroyEdit;
