import React from "react";
import { useHistory } from "react-router-dom";

import { Scene_findScene as Scene } from "src/graphql/definitions/Scene";
import { useAddScene, SceneUpdateInput, SceneCreateInput } from "src/graphql";
import { sceneHref } from "src/utils";

import SceneForm from "./sceneForm";

const SceneAdd: React.FC = () => {
  const history = useHistory();
  const [insertScene] = useAddScene({
    onCompleted: (data) => {
      if (data?.sceneCreate?.id) history.push(sceneHref(data.sceneCreate));
    },
  });

  const doInsert = (updateData: SceneUpdateInput) => {
    const { id, ...sceneData } = updateData;
    const insertData: SceneCreateInput = {
      ...sceneData,
      fingerprints: updateData.fingerprints || [],
    };
    insertScene({ variables: { sceneData: insertData } });
  };

  const emptyScene: Scene = {
    id: "",
    date: null,
    title: null,
    details: null,
    urls: [],
    studio: null,
    director: null,
    images: [],
    tags: [],
    fingerprints: [],
    performers: [],
    __typename: "Scene",
  };

  return (
    <div>
      <h2>Add new scene</h2>
      <hr />
      <SceneForm scene={emptyScene} callback={doInsert} />
    </div>
  );
};

export default SceneAdd;
