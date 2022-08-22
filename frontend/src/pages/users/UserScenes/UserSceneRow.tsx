import { FC } from "react";
import { Link } from "react-router-dom";
import { Card, Col, Row } from "react-bootstrap";
import { faVideo } from "@fortawesome/free-solid-svg-icons";

import { Scenes_queryScenes_scenes as Performance } from "src/graphql/definitions/Scenes";
import { getImage, sceneHref, studioHref, formatDuration } from "src/utils";
import { Icon } from "src/components/fragments";

const UserSceneRow: FC<{ performance: Performance }> = ({ performance }) => (
  <tr>
    <td><Link className="text-truncate w-100" to={sceneHref(performance)}>{performance.title}</Link></td>
    <td>{performance.studio && (
          <Link
            to={studioHref(performance.studio)}
            className="float-end text-truncate SceneCard-studio-name"
          >
            <Icon icon={faVideo} className="me-1" />
            {performance.studio.name}
          </Link>
        )}</td>
    <td>{performance.duration ? formatDuration(performance.duration) : ""}</td>
    <td>{performance.release_date}</td>
    <td>x</td>
  </tr>
);

export default UserSceneRow;
