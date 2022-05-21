import { FC, useState } from "react";
import { useHistory } from "react-router-dom";

import { useTagEdit, OperationEnum, TagEditDetailsInput } from "src/graphql";

import { editHref } from "src/utils";
import TagForm from "./tagForm";

const TagAddComponent: FC = () => {
  const history = useHistory();
  const [submissionError, setSubmissionError] = useState("");
  const [insertTagEdit, { loading: saving }] = useTagEdit({
    onCompleted: (data) => {
      if (submissionError) setSubmissionError("");
      if (data.tagEdit.id) history.push(editHref(data.tagEdit));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  const doInsert = (insertData: TagEditDetailsInput, editNote: string) => {
    insertTagEdit({
      variables: {
        tagData: {
          edit: {
            operation: OperationEnum.CREATE,
            comment: editNote,
          },
          details: insertData,
        },
      },
    });
  };

  return (
    <div>
      <h3>Add new tag</h3>
      <hr />
      <TagForm callback={doInsert} saving={saving} />
      {submissionError && (
        <div className="text-danger text-end col-9">
          Error: {submissionError}
        </div>
      )}
    </div>
  );
};

export default TagAddComponent;
