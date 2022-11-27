import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  useTagEditUpdate,
  TagEditDetailsInput,
  EditUpdateQuery,
} from "src/graphql";
import { createHref, isTag, isTagEdit } from "src/utils";
import TagForm from "./tagForm";

type EditUpdate = NonNullable<EditUpdateQuery["findEdit"]>;

import { ROUTE_EDIT } from "src/constants";
import Title from "src/components/title";

export const TagEditUpdate: FC<{ edit: EditUpdate }> = ({ edit }) => {
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState("");
  const [updateTagEdit, { loading: saving }] = useTagEditUpdate({
    onCompleted: (result) => {
      if (submissionError) setSubmissionError("");
      if (result.tagEditUpdate.id)
        navigate(createHref(ROUTE_EDIT, result.tagEditUpdate));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  if (!isTagEdit(edit.details) || (edit.target && !isTag(edit.target)))
    return null;

  const doUpdate = (updateData: TagEditDetailsInput, editNote: string) => {
    updateTagEdit({
      variables: {
        id: edit.id,
        tagData: {
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

  const tagName = edit.target?.name ?? edit.details.name;

  return (
    <div>
      <Title page={`Update tag edit for "${tagName}"`} />
      <h3>
        Update tag edit for
        <i className="ms-2">
          <b>{tagName}</b>
        </i>
      </h3>
      <hr />
      <TagForm
        tag={edit.target}
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
