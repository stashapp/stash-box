import { FC, useState } from "react";
import { useHistory, Link } from "react-router-dom";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

import { sceneHref } from "src/utils/route";
import {
  Draft_findDraft as Draft,
  Draft_findDraft_data_SceneDraft as SceneDraft,
} from "src/graphql/definitions/Draft";
import { Scene_findScene as Scene } from "src/graphql/definitions/Scene";
import {
  useScene,
  useSceneEdit,
  OperationEnum,
  SceneEditDetailsInput,
  useScenesWithoutCount,
  CriterionModifier,
  SortDirectionEnum,
  SceneSortEnum,
} from "src/graphql";
import { Icon, LoadingIndicator } from "src/components/fragments";
import { editHref } from "src/utils";
import { parseSceneDraft } from "./parse";

import SceneForm from "src/pages/scenes/sceneForm";

interface Props {
  draft: Omit<Draft, "data"> & { data: SceneDraft };
}

const SceneDraftAdd: FC<Props> = ({ draft }) => {
  const isUpdate = Boolean(draft.data.id);
  const history = useHistory();
  const [submissionError, setSubmissionError] = useState("");
  const [submitSceneEdit, { loading: saving }] = useSceneEdit({
    onCompleted: (data) => {
      if (submissionError) setSubmissionError("");
      if (data.sceneEdit.id) history.push(editHref(data.sceneEdit));
    },
    onError: (error) => setSubmissionError(error.message),
  });
  const { data: scene, loading: loadingScene } = useScene({ id: draft.data.id ?? '' }, isUpdate);
  const { data: fingerprintMatches } = useScenesWithoutCount({
    input: {
      fingerprints: {
        modifier: CriterionModifier.INCLUDES,
        value: draft.data.fingerprints.map((f) => f.hash),
      },
      page: 1,
      per_page: 100,
      direction: SortDirectionEnum.DESC,
      sort: SceneSortEnum.CREATED_AT,
    },
  }, isUpdate);

  const doInsert = (updateData: SceneEditDetailsInput, editNote: string) => {
    const details: SceneEditDetailsInput = {
      ...updateData,
      fingerprints: draft.data.fingerprints.map(
        ({ __typename, ...rest }) => rest
      ),
      draft_id: draft.id,
    };

    submitSceneEdit({
      variables: {
        sceneData: {
          edit: {
            id: draft.data.id,
            operation: isUpdate ? OperationEnum.MODIFY : OperationEnum.CREATE,
            comment: editNote,
          },
          details,
        },
      },
    });
  };

  if (loadingScene)
    return <LoadingIndicator />;

  const [initialScene, unparsed] = parseSceneDraft(draft.data);
  const remainder = Object.entries(unparsed)
    .filter(([, val]) => !!val)
    .map(([key, val]) => (
      <li key={key}>
        <b className="me-2">{key}:</b>
        <span>{val}</span>
      </li>
    ));

  const existingScenes = fingerprintMatches?.queryScenes?.scenes ?? [];

  return (
    <div>
      <h3>{isUpdate ? "Update" : "Add new" } scene from draft</h3>
      <hr />
      {remainder.length > 0 && (
        <>
          <h6>Unmatched data:</h6>
          <ul>{remainder}</ul>
          <hr />
        </>
      )}
      {existingScenes.length > 0 && (
        <>
          <h6>
            <b>Warning</b>: Scenes already exist in the database with the same
            fingerprint:
          </h6>
          {existingScenes.map((s) => (
            <div key={s.id}>
              <Icon icon={faExclamationTriangle} color="orange" />
              <Link to={sceneHref(s)} className="ms-2">
                {s.title}
              </Link>
            </div>
          ))}
          <div className="my-2">
            Please verify your draft is not already in the database before
            submitting.
          </div>
        </>
      )}
      <SceneForm
        scene={scene?.findScene ?? undefined}
        initial={initialScene}
        callback={doInsert}
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

export default SceneDraftAdd;
