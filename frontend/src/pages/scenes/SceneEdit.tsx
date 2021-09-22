import React, { useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import {
  useScene,
  useSceneEdit,
  SceneEditDetailsInput,
  OperationEnum,
} from "src/graphql";
import { LoadingIndicator } from "src/components/fragments";
import { createHref } from "src/utils";
import { ROUTE_EDIT } from "src/constants";
import SceneForm from "./sceneForm";

const SceneEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [submissionError, setSubmissionError] = useState("");
  const { loading, data: scene } = useScene({ id });
  const [insertSceneEdit, { loading: saving }] = useSceneEdit({
    onCompleted: (data) => {
      if (submissionError) setSubmissionError("");
      if (data.sceneEdit.id)
        history.push(createHref(ROUTE_EDIT, data.sceneEdit));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  if (loading) return <LoadingIndicator message="Loading studio..." />;
  if (!scene?.findScene) return <div>Scene not found!</div>;

  const doUpdate = (updateData: SceneEditDetailsInput, editNote: string) => {
    insertSceneEdit({
      variables: {
        sceneData: {
          edit: {
            id: scene.findScene?.id,
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
      <h3>Edit “{scene.findScene.title}”</h3>
      <hr />
      <SceneForm scene={scene.findScene} callback={doUpdate} saving={saving} />
      {submissionError && (
        <div className="text-danger text-right col-9">
          Error: {submissionError}
        </div>
      )}
    </div>
  );
};

export default SceneEdit;
