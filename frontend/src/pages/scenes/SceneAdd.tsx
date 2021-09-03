import React from "react";
import { useHistory } from "react-router-dom";

import { Scene_findScene as Scene } from "src/graphql/definitions/Scene";
import {
  useSceneEdit,
  OperationEnum,
  SceneEditDetailsInput,
} from "src/graphql";
import { editHref } from "src/utils";

import SceneForm from "./sceneForm";

const SceneAdd: React.FC = () => {
  const history = useHistory();
  const [submitSceneEdit, { loading: saving }] = useSceneEdit({
    onCompleted: (data) => {
      if (data.sceneEdit.id) history.push(editHref(data.sceneEdit));
    },
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

  const emptyScene: Scene = {
    id: "",
    date: null,
    title: null,
    details: null,
    urls: [],
    studio: null,
    director: null,
    duration: null,
    images: [],
    tags: [],
    fingerprints: [],
    performers: [],
    __typename: "Scene",
  };

  return (
    <div>
      <h3>Add new scene</h3>
      <hr />
      <SceneForm scene={emptyScene} callback={doInsert} saving={saving} />
    </div>
  );
};

export default SceneAdd;
