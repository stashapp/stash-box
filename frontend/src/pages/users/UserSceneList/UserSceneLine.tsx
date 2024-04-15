import { FC } from "react";

import { FingerprintAlgorithm, ScenesWithFingerprintsQuery} from "src/graphql";
import { Icon } from "src/components/fragments";
import { Link } from "react-router-dom";
import { sceneHref, studioHref, formatDuration } from "src/utils";
import {
  faCheckCircle,
  faTimesCircle,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  scene: ScenesWithFingerprintsQuery['queryScenes']['scenes'][number];
  deleteFingerprint: (
    sceneId: string,
    hash: string,
    algo: FingerprintAlgorithm,
    duration: number
  ) => void;
}

const UserSceneLine: FC<Props> = ({ scene, deleteFingerprint }) => {
  const fingerprints = scene.fingerprints.map(fp => (
      <div key={fp.hash}>
        {fp.hash} ({formatDuration(fp.duration)})
        <span
          className="user-submitted"
          title="Submitted by you - click to remove submission"
          onClick={() =>
            deleteFingerprint(
              scene.id,
              fp.hash,
              fp.algorithm,
              fp.duration
            )
          }
        >
          <Icon icon={faCheckCircle} />
          <Icon icon={faTimesCircle} />
        </span>
      </div>
    ));


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
