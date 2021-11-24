import React from "react";
import { Link } from "react-router-dom";
import { Edits_queryEdits_edits as Edit } from "src/graphql/definitions/Edits";
import { OperationEnum } from "src/graphql";
import { isPerformer, isTag, tagHref, performerHref } from "src/utils";

interface EditHeaderProps {
  edit: Edit;
}

const EditHeader: React.FC<EditHeaderProps> = ({ edit }) => {
  if (!edit.target || (!isTag(edit.target) && !isPerformer(edit.target)))
    return <></>;
  let route = "";
  if (isTag(edit.target)) route = tagHref(edit.target);
  else if (isPerformer(edit.target)) route = performerHref(edit.target);

  if (edit.operation === OperationEnum.MODIFY) {
    return (
      <h6 className="row mb-4">
        <span className="col-2 text-right">
          Modifying {edit.target_type.toLowerCase()}:
        </span>
        <Link to={route}>{edit.target.name}</Link>
      </h6>
    );
  }

  if (edit.applied && edit.operation === OperationEnum.CREATE) {
    return (
      <h6 className="row mb-4">
        <span className="col-2 text-right">
          Created {edit.target_type.toLowerCase()}:
        </span>
        <Link to={route}>{edit.target.name}</Link>
      </h6>
    );
  }

  return <></>;
};

export default EditHeader;
