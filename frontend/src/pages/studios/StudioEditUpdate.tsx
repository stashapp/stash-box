import { FC, useState } from "react";
import { useHistory } from "react-router-dom";

import { useStudioEditUpdate, StudioEditDetailsInput } from "src/graphql";
import { createHref, isStudio, isStudioDetails } from "src/utils";
import StudioForm from "./studioForm";

import { EditUpdate_findEdit as Edit } from "src/graphql/definitions/EditUpdate";
import { ROUTE_EDIT } from "src/constants";

export const StudioEditUpdate: FC<{ edit: Edit }> = ({ edit }) => {
  const history = useHistory();
  const [submissionError, setSubmissionError] = useState("");
  const [updateStudioEdit, { loading: saving }] = useStudioEditUpdate({
    onCompleted: (result) => {
      if (submissionError) setSubmissionError("");
      if (result.studioEditUpdate.id)
        history.push(createHref(ROUTE_EDIT, result.studioEditUpdate));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  if (
    !isStudioDetails(edit.details) ||
    (edit.target !== null && !isStudio(edit.target))
  )
    return null;

  const doUpdate = (updateData: StudioEditDetailsInput, editNote: string) => {
    updateStudioEdit({
      variables: {
        id: edit.id,
        studioData: {
          edit: {
            id: edit.target?.id,
            operation: edit.operation,
            comment: editNote,
          },
          details: updateData,
        },
      },
    });
  };

  return (
    <div>
      <h3>
        Update studio edit for
        <i className="ms-2">
          <b>{edit?.target?.name ?? edit.details?.name}</b>
        </i>
      </h3>
      <hr />
      <StudioForm
        studio={edit.target}
        initial={edit.details}
        callback={doUpdate}
        saving={saving}
      />
      {submissionError && (
        <div className="text-danger text-end col-9">
          Error: {submissionError}
        </div>
      )}
    </div>
  );
};
