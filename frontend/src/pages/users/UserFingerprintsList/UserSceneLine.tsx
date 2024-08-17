import { FC } from "react";

import { FingerprintAlgorithm, ScenesWithFingerprintsQuery} from "src/graphql";
import { Icon } from "src/components/fragments";
import { Link } from "react-router-dom";
import { Button } from 'react-bootstrap';
import { sceneHref, studioHref, formatDuration } from "src/utils";
import {
  faVideo,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { UserFingerprint } from './UserFingerprint';

interface Props {
  scene: ScenesWithFingerprintsQuery['queryScenes']['scenes'][number];
  deleteFingerprints: (fingerprints: {
    scene_id: string,
    hash: string,
    algorithm: FingerprintAlgorithm,
    duration: number
  }[]) => void;
}

const UserSceneLine: FC<Props> = ({ scene, deleteFingerprints }) => (
    <>
    <tr key={scene.id}>
      <td width="10">
        <Button variant="link" className="text-danger" onClick={() => deleteFingerprints(scene.fingerprints.map(fp => ({ ...fp, scene_id: scene.id })))}><Icon icon={faTrashCan} className="me-1" title="Delete all of your submitted fingerprints for this scene" /></Button>
      </td>
      <td>
        <Link className="text-truncate w-100" to={sceneHref(scene)}>
          {scene.title}
        </Link>
      </td>
      <td>
        {scene.studio && (
          <Link
            to={studioHref(scene.studio)}
            className="text-truncate SceneCard-studio-name"
          >
            <Icon icon={faVideo} className="me-1" />
            {scene.studio.name}
          </Link>
        )}
      </td>
      <td>{scene.duration ? formatDuration(scene.duration) : ""}</td>
      <td>{scene.release_date}</td>
    </tr>
    <tr key={`${scene}-fps`}>
      <td colSpan={4}>
        <ul>
          { scene.fingerprints.map(fp => (
            <UserFingerprint fingerprint={fp} deleteFingerprint={() => deleteFingerprints([{ ...fp, scene_id: scene.id }])} key={fp.hash} />
          )) }
        </ul>
      </td>
    </tr>
  </>
);

export default UserSceneLine;
