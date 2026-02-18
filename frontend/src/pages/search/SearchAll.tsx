import type { FC } from "react";
import { useSearchParams } from "react-router-dom";
import { Col, Row } from "react-bootstrap";

import { useSearchAll } from "src/graphql";
import { LoadingIndicator } from "src/components/fragments";

import { PerformerCard } from "./PerformerCard";
import { SceneCard } from "./SceneCard";

export const SearchAll: FC = () => {
  const [searchParams] = useSearchParams();
  const term = searchParams.get("q") ?? "";

  const { data, loading } = useSearchAll({ term, limit: 10 }, !term);

  if (!term) return null;

  if (loading) {
    return <LoadingIndicator message="Searching..." />;
  }

  if (!data) return null;

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
