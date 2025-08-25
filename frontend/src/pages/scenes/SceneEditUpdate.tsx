import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  useSceneEditUpdate,
  type SceneEditDetailsInput,
  type EditUpdateQuery,
} from "src/graphql";
import { createHref, isScene, isSceneEdit } from "src/utils";
import SceneForm from "./sceneForm";

type EditUpdate = NonNullable<EditUpdateQuery["findEdit"]>;

import { ROUTE_EDIT } from "src/constants";
import Title from "src/components/title";

export const SceneEditUpdate: FC<{ edit: EditUpdate }> = ({ edit }) => {
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState("");
  const [updateSceneEdit, { loading: saving }] = useSceneEditUpdate({
    onCompleted: (result) => {
      if (submissionError) setSubmissionError("");
      if (result.sceneEditUpdate.id)
        navigate(createHref(ROUTE_EDIT, result.sceneEditUpdate));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  if (!isSceneEdit(edit.details) || (edit.target && !isScene(edit.target)))
    return null;

  const doUpdate = (updateData: SceneEditDetailsInput, editNote: string) => {
    if (!isSceneEdit(edit.details)) return;

    const details: SceneEditDetailsInput = {
      ...updateData,
      draft_id: edit.details.draft_id,
      fingerprints: edit.details.fingerprints,
    };
    updateSceneEdit({
      variables: {
        id: edit.id,
        sceneData: {
          edit: {
            id: edit.target?.id,
            operation: edit.operation,
            comment: editNote,
          },
          details,
        },
      },
    });
  };

  const sceneTitle = edit.target?.title ?? edit.details.title;

  return (
    <div>
      <Title page={`Update scene edit for "${sceneTitle}"`} />
      <h3>
        Update scene edit for
        <i className="ms-2">
          <b>{sceneTitle}</b>
        </i>
      </h3>
      <hr />
      <SceneForm
        scene={edit.target}
        initial={edit.details}
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
