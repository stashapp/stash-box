import React from "react";
import { Link } from "react-router-dom";
import { Edits_queryEdits_edits as Edit } from "src/graphql/definitions/Edits";
import { OperationEnum } from "src/graphql";
import {
  isValidEditTarget,
  getEditTargetRoute,
  getEditTargetName,
} from "src/utils";

interface EditHeaderProps {
  edit: Edit;
}

const EditHeader: React.FC<EditHeaderProps> = ({ edit }) => {
  if (!isValidEditTarget(edit.target)) return <></>;

  const route = getEditTargetRoute(edit.target);

  if (edit.operation === OperationEnum.MODIFY) {
    return (
      <h6 className="row mb-4">
        <span className="col-2 text-right">
          Modifying {edit.target_type.toLowerCase()}:
        </span>
        <Link to={route}>{getEditTargetName(edit.target)}</Link>
      </h6>
    );
  }

  if (edit.applied && edit.operation === OperationEnum.CREATE) {
    return (
      <h6 className="row mb-4">
        <span className="col-2 text-right">
          Created {edit.target_type.toLowerCase()}:
        </span>
        <Link to={route}>{getEditTargetName(edit.target)}</Link>
      </h6>
    );
  }

  return <></>;
};

export default EditHeader;
