import { FC } from "react";
import { Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FingerprintAlgorithm, useQueryExistingScene } from "src/graphql";
import { Icon } from "src/components/fragments";
import { sceneHref, editHref } from "src/utils";

interface Props {
  title: string | null;
  studio_id: string | null;
  fingerprints:
    | {
        hash: string;
        algorithm: FingerprintAlgorithm;
        duration: number;
      }[]
    | undefined;
}

const ExistingSceneAlert: FC<Props> = ({
  title,
  studio_id,
  fingerprints = [],
}) => {
  const { data: existingData } = useQueryExistingScene({
    input: { title, studio_id, fingerprints },
  });
  const existingScenes = existingData?.queryExistingScene.scenes ?? [];
  const existingEdits = existingData?.queryExistingScene.edits ?? [];

  if (existingScenes.length === 0 && existingEdits.length === 0) return null;

  return (
    <Alert variant="warning">
      <div className="mb-2">
        <b>Warning: Scene match found</b>
      </div>

      {existingScenes.length > 0 && (
        <div className="mb-2">
          <span>Existing scenes that have the same title or fingerprints:</span>
          {existingScenes.map((s) => (
            <div key={s.id}>
              <Icon icon={faExclamationTriangle} color="red" />
              <Link to={sceneHref(s)} className="ms-2">
                <b>{s.title}</b>
              </Link>
            </div>
          ))}
        </div>
      )}

      {existingEdits.length > 0 && (
        <div className="mb-2">
          <span>
            Pending edits that submit scenes with the same title or
            fingerprints:
          </span>
          {existingEdits.map((e) => (
            <div key={e.id}>
              <Icon icon={faExclamationTriangle} color="red" />
              <Link to={editHref(e)} className="ms-2">
                <b>{(e.details as { title: string }).title}</b>
              </Link>
            </div>
          ))}
        </div>
      )}

      <div>
        Please verify your draft is not already in the database before
        submitting.
      </div>
    </Alert>
  );
};

export default ExistingSceneAlert;
