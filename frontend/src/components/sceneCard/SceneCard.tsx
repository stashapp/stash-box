import { FC } from "react";
import { Link } from "react-router-dom";
import { Card } from "react-bootstrap";
import { faVideo } from "@fortawesome/free-solid-svg-icons";

import { Scenes_queryScenes_scenes as Performance } from "src/graphql/definitions/Scenes";
import { getImage, sceneHref, studioHref, formatDuration } from "src/utils";
import { Icon } from "src/components/fragments";

const CLASSNAME = "SceneCard";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_BODY = `${CLASSNAME}-body`;

const SceneCard: FC<{ performance: Performance }> = ({ performance }) => (
  <Card className={CLASSNAME}>
    <Card.Body className={CLASSNAME_BODY}>
      <Link className={CLASSNAME_IMAGE} to={sceneHref(performance)}>
        <img alt="" src={getImage(performance.images, "landscape")} />
      </Link>
    </Card.Body>
    <Card.Footer>
      <div className="d-flex">
        <Link className="text-truncate w-100" to={sceneHref(performance)}>
          <h6 className="text-truncate">{performance.title}</h6>
        </Link>
        <span className="text-muted">
          {performance.duration ? formatDuration(performance.duration) : ""}
        </span>
      </div>
      <div className="text-muted">
        {performance.studio && (
          <Link
            to={studioHref(performance.studio)}
            className="float-end text-truncate SceneCard-studio-name"
          >
            <Icon icon={faVideo} className="me-1" />
            {performance.studio.name}
          </Link>
        )}
        <strong>{performance.date}</strong>
      </div>
    </Card.Footer>
  </Card>
);

export default SceneCard;
