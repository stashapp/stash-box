import { FC, useState } from "react";
import { useHistory } from "react-router-dom";

import {
  useSceneEdit,
  OperationEnum,
  SceneEditDetailsInput,
} from "src/graphql";
import { editHref } from "src/utils";

import SceneForm from "./sceneForm";

const SceneAdd: FC = () => {
  const history = useHistory();
  const [submissionError, setSubmissionError] = useState("");
  const [submitSceneEdit, { loading: saving }] = useSceneEdit({
    onCompleted: (data) => {
      if (submissionError) setSubmissionError("");
      if (data.sceneEdit.id) history.push(editHref(data.sceneEdit));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  const doInsert = (updateData: SceneEditDetailsInput, editNote: string) => {
    submitSceneEdit({
      variables: {
        sceneData: {
          edit: {
            operation: OperationEnum.CREATE,
            comment: editNote,
          },
          details: updateData,
        },
      },
    });
  };

  return (
    <div>
      <h3>Add new scene</h3>
      <hr />
      <SceneForm callback={doInsert} saving={saving} isCreate />
      {submissionError && (
        <div className="text-danger text-end col-9">
          Error: {submissionError}
        </div>
      )}
    </div>
  );
};

export default SceneAdd;
