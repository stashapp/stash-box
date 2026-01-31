import type { FC } from "react";
import { Link } from "react-router-dom";
import { Card } from "react-bootstrap";
import { faCalendar, faUsers, faVideo } from "@fortawesome/free-solid-svg-icons";

import type { SearchAllQuery } from "src/graphql";
import { Icon, Thumbnail } from "src/components/fragments";
import { getImage, sceneHref, formatDuration } from "src/utils";

export type Scene = NonNullable<
  SearchAllQuery["searchScene"]["scenes"][number]
>;

export const SceneCard: FC<{ scene: Scene }> = ({ scene }) => (
  <Link to={sceneHref(scene)} className="SearchPage-scene">
    <Card>
      <Thumbnail
        image={getImage(scene.images, "landscape")}
        className="SearchPage-scene-image"
        size={300}
      />
      <div className="ms-3 w-100">
        <h5>
          {scene.title}
          <small className="text-muted ms-2">
            {formatDuration(scene.duration)}
          </small>
        </h5>
        <div>
          <div>
            <Icon icon={faCalendar} />
            {scene.release_date}
          </div>
          <div>
            <Icon icon={faVideo} />
            {scene.studio?.name ?? "Unknown"}
            <small className="text-muted ms-2">{scene.code}</small>
          </div>
          {scene.performers.length > 0 && (
            <div>
              <Icon icon={faUsers} />
              {scene.performers.map((p) => p.as ?? p.performer.name).join(", ")}
            </div>
          )}
        </div>
      </div>
    </Card>
  </Link>
);

