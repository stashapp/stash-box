import { FC, useState } from "react";
import { useHistory } from "react-router-dom";

import { usePerformerEditUpdate, PerformerEditDetailsInput } from "src/graphql";
import { createHref, isPerformer, isPerformerDetails } from "src/utils";
import PerformerForm from "./performerForm";

import { EditUpdate_findEdit as Edit } from "src/graphql/definitions/EditUpdate";
import { ROUTE_EDIT } from "src/constants";

export const PerformerEditUpdate: FC<{ edit: Edit }> = ({ edit }) => {
  const history = useHistory();
  const [submissionError, setSubmissionError] = useState("");
  const [updatePerformerEdit, { loading: saving }] = usePerformerEditUpdate({
    onCompleted: (result) => {
      if (submissionError) setSubmissionError("");
      if (result.performerEditUpdate.id)
        history.push(createHref(ROUTE_EDIT, result.performerEditUpdate));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  if (
    !isPerformerDetails(edit.details) ||
    (edit.target && !isPerformer(edit.target))
  )
    return null;

  const doUpdate = (
    updateData: PerformerEditDetailsInput,
    editNote: string
  ) => {
    updatePerformerEdit({
      variables: {
        id: edit.id,
        performerData: {
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

  const initial = {
    ...edit.details,
    measurements: {
      waist: edit.details?.waist_size ?? null,
      hip: edit.details?.hip_size ?? null,
      band_size: edit.details?.band_size ?? null,
      cup_size: edit.details?.cup_size ?? null,
    },
  };

  return (
    <div>
      <h3>
        Update performer edit for
        <i>
          <b>{edit.target?.name ?? edit.details.name}</b>
        </i>
      </h3>
      <hr />
      <PerformerForm
        performer={edit.target}
        initial={initial}
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
