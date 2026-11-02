import { faVideo } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import { Card } from "react-bootstrap";
import { Icon, Thumbnail } from "src/components/fragments";
import type { Scene, Studio } from "src/graphql";
import { formatDuration, imageType } from "src/utils";

type Performance = Pick<Scene, "id" | "title" | "duration" | "release_date"> & {
  images: { url: string; width: number; height: number }[];
  studio?: Pick<Studio, "id" | "name"> | null;
};

const CLASSNAME = "SceneCard";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_BODY = `${CLASSNAME}-body`;

const SceneCard: FC<{ scene: Performance }> = ({ scene }) => (
  <Card className={CLASSNAME}>
    <Card.Body className={CLASSNAME_BODY}>
      <Link className={CLASSNAME_IMAGE} to="/scenes/$id" params={scene}>
        <Thumbnail
          alt={scene.title}
          className={imageType(scene.images[0])}
          image={scene.images[0]?.url}
          size={300}
        />
      </Link>
    </Card.Body>
    <Card.Footer>
      <div className="d-flex">
        <Link
          className="text-truncate w-100"
          to="/scenes/$id"
          params={scene}
          title={scene.title ?? ""}
        >
          <h6 className="text-truncate">{scene.title}</h6>
        </Link>
        <span className="text-muted">
          {scene.duration ? formatDuration(scene.duration) : ""}
        </span>
      </div>
      <div className="text-muted">
        {scene.studio && (
          <Link
            to="/studios/$id"
            params={scene.studio}
            className="float-end text-truncate SceneCard-studio-name"
          >
            <Icon icon={faVideo} className="me-1" />
            {scene.studio.name}
          </Link>
        )}
        <strong>{scene.release_date}</strong>
      </div>
    </Card.Footer>
  </Card>
);

export default SceneCard;
