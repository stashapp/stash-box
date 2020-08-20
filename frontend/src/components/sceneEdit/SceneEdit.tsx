import React from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useHistory, useParams } from "react-router-dom";
import { loader } from "graphql.macro";

import { Scene } from "src/definitions/Scene";
import { UpdateSceneMutationVariables } from "src/definitions/UpdateSceneMutation";
import { SceneUpdateInput } from "src/definitions/globalTypes";

import { LoadingIndicator } from "src/components/fragments";
import SceneForm from "src/components/sceneForm";

const SceneQuery = loader("src/queries/Scene.gql");
const UpdateSceneMutation = loader("src/mutations/UpdateScene.gql");

const SceneEdit: React.FC = () => {
  const { id } = useParams();
  const history = useHistory();
  const { loading, data } = useQuery<Scene>(SceneQuery, {
    variables: { id },
  });
  const [updateScene] = useMutation<Scene, UpdateSceneMutationVariables>(
    UpdateSceneMutation,
    {
      onCompleted: () => {
        if (data?.findScene?.id) history.push(`/scenes/${data.findScene.id}`);
      },
    }
  );

  const doUpdate = (updateData: SceneUpdateInput) => {
    updateScene({ variables: { updateData } });
  };

  if (loading) return <LoadingIndicator message="Loading studio..." />;

  if (!data?.findScene) return <div>Scene not found!</div>;

  return (
    <div>
      <h2>Edit “{data.findScene.title}”</h2>
      <hr />
      <SceneForm scene={data.findScene} callback={doUpdate} />
    </div>
  );
};

export default SceneEdit;
