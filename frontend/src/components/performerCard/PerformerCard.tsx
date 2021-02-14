import React from "react";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";

import { Performers_queryPerformers_performers as Performer } from "src/definitions/Performers";
import { SearchPerformers_searchPerformer as SearchPerformer } from "src/definitions/SearchPerformers";

import { PerformerName } from "src/components/fragments";
import { getImage, performerHref } from "src/utils";

interface PerformerCardProps {
  performer: Performer | SearchPerformer;
  className?: string;
}

const CLASSNAME = "PerformerCard";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;

const PerformerCard: React.FC<PerformerCardProps> = ({ performer }) => (
  <Card className={CLASSNAME}>
    <Link to={performerHref(performer)}>
      <div className={CLASSNAME_IMAGE}>
        <img
          src={getImage(performer.images, "portrait")}
          alt={performer.name}
          title={performer.name}
        />
      </div>
      <Card.Footer>
        <h5>
          <PerformerName performer={performer} />
        </h5>
      </Card.Footer>
    </Link>
  </Card>
);

export default PerformerCard;
