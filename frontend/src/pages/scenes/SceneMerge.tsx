import { type FC, useMemo, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { LoadingIndicator } from "src/components/fragments";
import SceneSelect, { type SceneSlim } from "src/components/sceneSelect";
import {
  OperationEnum,
  type SceneFragment as Scene,
  type SceneEditDetailsInput,
  useSceneEdit,
} from "src/graphql";
import { SceneFragmentDoc } from "src/graphql/types";
import { useEntities } from "src/hooks";
import { editHref } from "src/utils";
import SceneForm from "./sceneForm";
import { buildSceneMerge } from "./sceneForm/merge";

interface Props {
  scene: Scene;
}

const SceneMerge: FC<Props> = ({ scene }) => {
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState("");
  const [mergeSources, setMergeSources] = useState<SceneSlim[]>([]);

  const {
    sources: loadedSources,
    ready: sourcesReady,
    error: sourcesError,
  } = useEntities<Scene>(mergeSources, "findScene", SceneFragmentDoc);

  const [insertSceneEdit, { loading: saving }] = useSceneEdit({
    onCompleted: (data) => {
      if (submissionError) setSubmissionError("");
      if (data.sceneEdit.id) navigate(editHref(data.sceneEdit));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  const doUpdate = (insertData: SceneEditDetailsInput, editNote: string) => {
    insertSceneEdit({
      variables: {
        sceneData: {
          edit: {
            id: scene.id,
            operation: OperationEnum.MERGE,
            merge_source_ids: mergeSources.map((s) => s.id),
            comment: editNote,
          },
          details: insertData,
        },
      },
    });
  };

  const { initial, conflicts } = useMemo(
    () => buildSceneMerge(scene, loadedSources),
    [scene, loadedSources],
  );

  return (
    <div>
      <h3>
        Merge scenes into <em>{scene.title}</em>
      </h3>
      <hr />
      <Row className="g-0">
        <Col xs={6}>
          <label htmlFor="scene-merge-source-select" className="form-label">
            Merge sources
          </label>
          <SceneSelect
            scenes={[]}
            onChange={(scenes) => setMergeSources(scenes)}
            message="Select scenes to merge:"
            excludeScenes={[scene.id, ...mergeSources.map((s) => s.id)]}
            inputId="scene-merge-source-select"
          />
        </Col>
        <Col xs={6}>
          <p>
            Merging scenes deletes the source scenes and redirects them to the
            target scene. Previously generated content referencing the source
            scenes will resolve to the target scene.
          </p>
          <p>
            This operation is not easily reversible and attention should be paid
            that all scenes are truly the same.
          </p>
        </Col>
      </Row>
      <hr className="my-4" />
      <h5>
        Modify <em>{scene.title}</em>
      </h5>
      <Row className="g-0">
        {submissionError && (
          <div className="text-danger mb-2">Error: {submissionError}</div>
        )}
        {sourcesError ? (
          <div className="text-danger">
            Failed to load scene details: {sourcesError.message}
          </div>
        ) : sourcesReady ? (
          <SceneForm
            scene={scene}
            callback={doUpdate}
            saving={saving}
            initial={initial}
            conflicts={conflicts}
          />
        ) : (
          <LoadingIndicator message="Loading scene details..." />
        )}
      </Row>
    </div>
  );
};

export default SceneMerge;
