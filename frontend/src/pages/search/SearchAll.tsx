import type { FC } from "react";
import { Col, Row } from "react-bootstrap";

import type { SearchAllQuery } from "src/graphql";

import { PerformerCard } from "./PerformerCard";
import { SceneCard } from "./SceneCard";

interface Props {
  data?: SearchAllQuery;
}

export const SearchAll: FC<Props> = ({ data }) => {
  if (!data) {
    return null;
  }

  return (
    <Row>
      <Col xs={6}>
        <h3>Performers</h3>
        <div>
          {data.searchPerformer.performers.map((p) => (
            <PerformerCard performer={p} key={p.id} />
          ))}
        </div>
      </Col>
      <Col xs={6}>
        <h3>Scenes</h3>
        {data.searchScene.scenes.map((s) => (
          <SceneCard scene={s} key={s.id} />
        ))}
      </Col>
    </Row>
  );
};

