import { FC, useState } from "react";
import { useHistory } from "react-router-dom";

import { useStudioEditUpdate, StudioEditDetailsInput } from "src/graphql";
import { createHref, isStudio, isStudioDetails } from "src/utils";
import StudioForm from "./studioForm";

import { EditUpdate_findEdit as Edit } from "src/graphql/definitions/EditUpdate";
import { ROUTE_EDIT } from "src/constants";
import Title from "src/components/title";

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
            merge_source_ids: edit.merge_sources.map((s) => s.id),
          },
          details: updateData,
        },
      },
    });
  };

  const studioName = edit?.target?.name ?? edit.details?.name;

  return (
    <div>
      <Title page={`Update studio edit for "${studioName}"`} />
      <h3>
        Update studio edit for
        <i className="ms-2">
          <b>{studioName}</b>
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
