import { FC } from "react";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import cx from "classnames";

import { PerformersQuery, SearchPerformersQuery } from "src/graphql";
type Performer = NonNullable<
  PerformersQuery["queryPerformers"]
>["performers"][number];
type SearchPerformer = NonNullable<
  SearchPerformersQuery["searchPerformer"]
>[number];

import {
  GenderIcon,
  FavoriteStar,
  PerformerName,
} from "src/components/fragments";
import { getImage, performerHref } from "src/utils";

interface PerformerCardProps {
  performer: Performer | SearchPerformer;
  className?: string;
}

const CLASSNAME = "PerformerCard";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_STAR = `${CLASSNAME}-star`;

const PerformerCard: FC<PerformerCardProps> = ({ className, performer }) => (
  <Card className={cx(CLASSNAME, className)}>
    <Link to={performerHref(performer)}>
      <div className={CLASSNAME_IMAGE}>
        <img
          src={getImage(performer.images, "portrait")}
          alt={performer.name}
          title={performer.name}
        />
        <FavoriteStar
          entity={performer}
          entityType="performer"
          className={CLASSNAME_STAR}
        />
      </div>
      <Card.Footer>
        <h5 className="my-1">
          <GenderIcon gender={performer.gender} />
          <PerformerName performer={performer} />
        </h5>
      </Card.Footer>
    </Link>
  </Card>
);

export default PerformerCard;
