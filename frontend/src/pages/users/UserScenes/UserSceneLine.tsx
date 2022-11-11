import { FC } from "react";

import { FingerprintAlgorithm, useScene } from "src/graphql";
import { Icon } from "src/components/fragments";
import { Link } from "react-router-dom";
import { sceneHref, studioHref, formatDuration } from "src/utils";
import {
  faCheckCircle,
  faTimesCircle,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  sceneId: string;
  deleteFingerprint: (
    sceneId: string,
    hash: string,
    algo: FingerprintAlgorithm,
    duration: number
  ) => void;
}

const UserSceneLine: FC<Props> = ({ sceneId, deleteFingerprint }) => {
  const { data } = useScene({ id: sceneId });
  const scene = data?.findScene;

  if (!scene) {
    return (
      <tr key={sceneId}>
        <td colSpan={0}></td>
      </tr>
    );
  }

  const getFingerprintLines = (alg: FingerprintAlgorithm) => {
    const filteredFingerprints = scene.fingerprints.filter(
      (fing) => fing.user_submitted && fing.algorithm == alg
    );

    const ret = filteredFingerprints.map((fing, index) => (
      <div key={`${fing.hash} "_" ${index}`}>
        {fing.hash} ({formatDuration(fing.duration)})
        <span
          className="user-submitted "
          title="Submitted by you - click to remove submission"
          onClick={() =>
            deleteFingerprint(
              scene.id,
              fing.hash,
              fing.algorithm,
              fing.duration
            )
          }
        >
          <Icon icon={faCheckCircle} />
          <Icon icon={faTimesCircle} />
        </span>
      </div>
    ));

    return ret;
  };

  return (
    <tr key={scene.id}>
      <td>
        <Link className="text-truncate w-100" to={sceneHref(scene)}>
          {scene.title}
        </Link>
      </td>
      <td>
        {scene.studio && (
          <Link
            to={studioHref(scene.studio)}
            className="float-end text-truncate SceneCard-studio-name"
          >
            <Icon icon={faVideo} className="me-1" />
            {scene.studio.name}
          </Link>
        )}
      </td>
      <td>{scene.duration ? formatDuration(scene.duration) : ""}</td>
      <td>{scene.release_date}</td>
      <td>{getFingerprintLines(FingerprintAlgorithm.PHASH)}</td>
      <td>{getFingerprintLines(FingerprintAlgorithm.OSHASH)}</td>
      <td>{getFingerprintLines(FingerprintAlgorithm.MD5)}</td>
    </tr>
  );
};

export default UserSceneLine;
