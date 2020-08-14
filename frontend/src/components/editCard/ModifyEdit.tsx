import React from "react";

import {
  Edits_queryEdits_edits_details as Details,
  Edits_queryEdits_edits_target as Target,
} from "src/definitions/Edits";
import { isTagTarget, isTagCreate } from "./utils";

import ChangeRow from "./ChangeRow";

interface ModifyEditProps {
  details?: Details | null;
  target?: Target | null;
}

const ModifyEdit: React.FC<ModifyEditProps> = ({ details, target }) => {
  if (!details) return null;

  const hasTarget = !!target;

  if (isTagCreate(details) && isTagTarget(target)) {
    return (
      <div>
        <ChangeRow
          name="Name"
          newValue={details.name}
          oldValue={target?.name}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Description"
          newValue={details.description}
          oldValue={target?.description}
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Added Aliases"
          newValue={details.added_aliases?.join(", ")}
          oldValue=""
          showDiff={hasTarget}
        />
        <ChangeRow
          name="Removed Aliases"
          newValue={details.removed_aliases?.join(", ")}
          oldValue=""
          showDiff={hasTarget}
        />
      </div>
    );
  }
  return null;
};

export default ModifyEdit;
