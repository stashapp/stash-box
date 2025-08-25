import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  useSceneEdit,
  type SceneEditDetailsInput,
  OperationEnum,
  type SceneFragment as Scene,
} from "src/graphql";
import { createHref } from "src/utils";
import { ROUTE_EDIT } from "src/constants";
import SceneForm from "./sceneForm";

interface Props {
  scene: Scene;
}

const SceneEdit: FC<Props> = ({ scene }) => {
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState("");
  const [insertSceneEdit, { loading: saving }] = useSceneEdit({
    onCompleted: (result) => {
      if (submissionError) setSubmissionError("");
      if (result.sceneEdit.id)
        navigate(createHref(ROUTE_EDIT, result.sceneEdit));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  const doUpdate = (updateData: SceneEditDetailsInput, editNote: string) => {
    insertSceneEdit({
      variables: {
        sceneData: {
          edit: {
            id: scene.id,
            operation: OperationEnum.MODIFY,
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
        Edit scene{" "}
        <i>
          <b>{scene.title}</b>
        </i>
      </h3>
      <hr />
      <SceneForm scene={scene} callback={doUpdate} saving={saving} />
      {submissionError && (
        <div className="text-danger text-end col-9">
          Error: {submissionError}
        </div>
      )}
    </div>
  );
};

export default SceneEdit;
