import React from "react";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Performers_queryPerformers_performers as Performer } from "src/definitions/Performers";

import { PerformerName } from "src/components/fragments";
import { getImage } from "src/utils/transforms";

interface PerformerCardProps {
  performer: Performer;
}

const CLASSNAME = "PerformerCard";
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;

const PerformerCard: React.FC<PerformerCardProps> = ({ performer }) => (
  <div key={performer.id} className={`col-12 col-lg-3 col-md-6 ${CLASSNAME}`}>
    <Card>
      <Link to={`/performers/${performer.id}`}>
        <div className={CLASSNAME_IMAGE}>
          <img src={getImage(performer.images, "portrait")} alt="" />
        </div>
        <Card.Footer>
          <h5>
            <PerformerName performer={performer} />
          </h5>
        </Card.Footer>
      </Link>
    </Card>
  </div>
);

export default PerformerCard;
