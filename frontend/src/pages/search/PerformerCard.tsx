import type { FC } from "react";
import { Link } from "react-router-dom";
import { Card } from "react-bootstrap";
import { faBirthdayCake, faFlag, faVideo } from "@fortawesome/free-solid-svg-icons";

import type { SearchAllQuery } from "src/graphql";
import {
  Icon,
  FavoriteStar,
  GenderIcon,
  PerformerName,
  Thumbnail,
} from "src/components/fragments";
import { getImage, getCountryByISO, performerHref } from "src/utils";

export type Performer = NonNullable<
  SearchAllQuery["searchPerformer"]["performers"][number]
>;

export const PerformerCard: FC<{ performer: Performer }> = ({ performer }) => (
  <Link to={performerHref(performer)} className="SearchPage-performer">
    <Card>
      <Thumbnail
        orientation="portrait"
        image={getImage(performer.images, "portrait")}
        className="SearchPage-performer-image"
        size={300}
      />
      <div className="ms-3">
        <h4>
          <GenderIcon gender={performer?.gender} />
          <PerformerName performer={performer} />
          <FavoriteStar
            entity={performer}
            entityType="performer"
            className="ps-2"
          />
          {performer.aliases.length > 0 && (
            <h6>
              <small>Aliases: {performer.aliases.join(", ")}</small>
            </h6>
          )}
        </h4>
        <div>
          {performer.birth_date && (
            <div>
              <Icon icon={faBirthdayCake} />
              {performer.birth_date}
            </div>
          )}
          {performer.country && (
            <div>
              <Icon icon={faFlag} />
              {getCountryByISO(performer.country)}
            </div>
          )}
          <div>
            <Icon icon={faVideo} />
            {performer.scene_count} scene{performer.scene_count !== 1 && "s"}
          </div>
        </div>
      </div>
    </Card>
  </Link>
);

