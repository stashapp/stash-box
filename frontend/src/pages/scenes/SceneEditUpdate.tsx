import { FC, useState } from "react";
import { useHistory } from "react-router-dom";

import {
  useSceneEditUpdate,
  SceneEditDetailsInput,
} from "src/graphql";
import {
  createHref,
  isScene,
  isSceneDetails,
  parseFuzzyDate,
} from "src/utils";
import SceneForm, { InitialScene } from "./sceneForm";

import { EditUpdate_findEdit as Edit } from "src/graphql/definitions/EditUpdate";
import { ROUTE_EDIT } from "src/constants";

export const SceneEditUpdate: FC<{ edit: Edit }> = ({ edit }) => {
  const history = useHistory();
  const [submissionError, setSubmissionError] = useState("");
  const [updateSceneEdit, { loading: saving }] = useSceneEditUpdate({
    onCompleted: (result) => {
      if (submissionError) setSubmissionError("");
      if (result.sceneEditUpdate.id)
        history.push(createHref(ROUTE_EDIT, result.sceneEditUpdate));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  if (!isScene(edit.target) || !isSceneDetails(edit.details)) return null;

  const doUpdate = (updateData: SceneEditDetailsInput, editNote: string) => {
    updateSceneEdit({
      variables: {
        id: edit.id,
        sceneData: {
          edit: {
            id: edit.target?.id,
            operation: edit.operation,
            comment: editNote,
          },
          details: updateData,
        },
      },
    });
  };

  const initial: InitialScene = {
    ...edit.details,
    date: parseFuzzyDate(edit.details.date),
  };

  return (
    <div>
      <h3>
        Update scene edit for
        <i>
          <b>{edit.target.title}</b>
        </i>
      </h3>
      <hr />
      <SceneForm
        scene={edit.target}
        initial={initial}
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
