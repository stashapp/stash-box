import React from "react";
import { Link } from "react-router-dom";

import { Edits_queryEdits_edits_target as Target } from "src/graphql/definitions/Edits";
import {
  isValidEditTarget,
  isTag,
  isPerformer,
  createHref,
  isStudio,
} from "src/utils";
import {
  ROUTE_TAGS,
  ROUTE_PERFORMERS,
  ROUTE_STUDIOS,
} from "src/constants/route";

interface DestroyProps {
  target?: Target | null;
}

const DestroyEdit: React.FC<DestroyProps> = ({ target }) => {
  function getRoute() {
    if (isTag(target)) {
      return ROUTE_TAGS;
    }
    if (isPerformer(target)) {
      return ROUTE_PERFORMERS;
    }
    if (isStudio(target)) {
      return ROUTE_STUDIOS;
    }
  }

  const route = getRoute();

  if (!isValidEditTarget(target) || !route)
    return <span>Unsupported target type</span>;

  return (
    <div>
      <div className="row">
        <b className="col-2 text-right">Deleting: </b>
        <Link to={createHref(route, target ?? undefined)}>
          <span className="EditDiff bg-danger">{target?.name}</span>
        </Link>
      </div>
    </div>
  );
};

export default DestroyEdit;
