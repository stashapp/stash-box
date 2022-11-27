import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  usePerformerEditUpdate,
  PerformerEditDetailsInput,
  EditUpdateQuery,
} from "src/graphql";
import { createHref, isPerformer, isPerformerEdit } from "src/utils";
import PerformerForm from "./performerForm";

type EditUpdate = NonNullable<EditUpdateQuery["findEdit"]>;

import { ROUTE_EDIT } from "src/constants";
import Title from "src/components/title";

export const PerformerEditUpdate: FC<{ edit: EditUpdate }> = ({ edit }) => {
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState("");
  const [updatePerformerEdit, { loading: saving }] = usePerformerEditUpdate({
    onCompleted: (result) => {
      if (submissionError) setSubmissionError("");
      if (result.performerEditUpdate.id)
        navigate(createHref(ROUTE_EDIT, result.performerEditUpdate));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  if (
    !isPerformerEdit(edit.details) ||
    (edit.target && !isPerformer(edit.target))
  )
    return null;

  const doUpdate = (
    updateData: PerformerEditDetailsInput,
    editNote: string,
    setModifyAliases: boolean
  ) => {
    if (!isPerformerEdit(edit.details)) return;

    const details: PerformerEditDetailsInput = {
      ...updateData,
      draft_id: edit.details.draft_id,
    };
    updatePerformerEdit({
      variables: {
        id: edit.id,
        performerData: {
          edit: {
            id: edit.target?.id,
            operation: edit.operation,
            comment: editNote,
            merge_source_ids: edit.merge_sources.map((s) => s.id),
          },
          options: {
            set_modify_aliases: setModifyAliases,
            set_merge_aliases: edit.options?.set_merge_aliases,
          },
          details,
        },
      },
    });
  };

  const performerName = edit.target?.name ?? edit.details.name;

  return (
    <div>
      <Title page={`Update performer edit for "${performerName}"`} />
      <h3>
        Update performer edit for
        <i className="ms-2">
          <b>{performerName}</b>
        </i>
      </h3>
      <hr />
      <PerformerForm
        performer={edit.target}
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
