import { FC } from "react";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import cx from "classnames";

import { Performer } from "src/graphql";

import {
  GenderIcon,
  FavoriteStar,
  PerformerName,
  Thumbnail,
} from "src/components/fragments";
import { getImage, performerHref } from "src/utils";

type PerformerType = Pick<
  Performer,
  "id" | "name" | "images" | "gender" | "is_favorite" | "deleted"
>;

interface PerformerCardProps {
  performer: PerformerType;
  className?: string;
}

const CLASSNAME = "PerformerCard";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_STAR = `${CLASSNAME}-star`;

const PerformerCard: FC<PerformerCardProps> = ({ className, performer }) => (
  <Card className={cx(CLASSNAME, className)}>
    <Link to={performerHref(performer)}>
      <div className={CLASSNAME_IMAGE}>
        <Thumbnail
          image={getImage(performer.images, "portrait")}
          alt={performer.name}
          size={300}
          orientation="portrait"
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
