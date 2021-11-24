import React from "react";
import { useHistory, useParams } from "react-router-dom";

import { useScene, useUpdateScene, SceneUpdateInput } from "src/graphql";
import { LoadingIndicator } from "src/components/fragments";
import { sceneHref } from "src/utils";
import SceneForm from "./sceneForm";

const SceneEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { loading, data } = useScene({ id });
  const [updateScene] = useUpdateScene({
    onCompleted: () => {
      if (data?.findScene?.id) history.push(sceneHref(data.findScene));
    },
  });

  const doUpdate = (updateData: SceneUpdateInput) => {
    updateScene({ variables: { updateData } });
  };

  if (loading) return <LoadingIndicator message="Loading studio..." />;

  if (!data?.findScene) return <div>Scene not found!</div>;

  return (
    <div>
      <h3>Edit “{data.findScene.title}”</h3>
      <hr />
      <SceneForm scene={data.findScene} callback={doUpdate} />
    </div>
  );
};

export default SceneEdit;
