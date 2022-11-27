import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  useStudioEdit,
  OperationEnum,
  StudioEditDetailsInput,
} from "src/graphql";
import { editHref } from "src/utils";

import StudioForm from "./studioForm";

const StudioAdd: FC = () => {
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState("");
  const [insertStudioEdit, { loading: saving }] = useStudioEdit({
    onCompleted: (data) => {
      if (submissionError) setSubmissionError("");
      if (data.studioEdit.id) navigate(editHref(data.studioEdit));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  const doInsert = (insertData: StudioEditDetailsInput, editNote: string) => {
    insertStudioEdit({
      variables: {
        studioData: {
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
      <h3>Add new studio</h3>
      <hr />
      <StudioForm callback={doInsert} saving={saving} />
      {submissionError && (
        <div className="text-danger text-end col-9">
          Error: {submissionError}
        </div>
      )}
    </div>
  );
};

export default StudioAdd;
