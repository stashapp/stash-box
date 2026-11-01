import { Link } from "@tanstack/react-router";
import cx from "classnames";
import type { FC } from "react";
import { Card } from "react-bootstrap";
import {
  FavoriteStar,
  GenderIcon,
  PerformerName,
  Thumbnail,
} from "src/components/fragments";
import type { Performer } from "src/graphql";

type PerformerType = Pick<
  Performer,
  "id" | "name" | "gender" | "is_favorite" | "deleted"
> & {
  images: { url: string }[];
};

interface PerformerCardProps {
  performer: PerformerType;
  className?: string;
}

const CLASSNAME = "PerformerCard";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_STAR = `${CLASSNAME}-star`;

const PerformerCard: FC<PerformerCardProps> = ({ className, performer }) => (
  <Card className={cx(CLASSNAME, className)}>
    <Link to="/performers/$id" params={performer}>
      <div className={CLASSNAME_IMAGE}>
        <Thumbnail
          image={performer.images[0]?.url}
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
