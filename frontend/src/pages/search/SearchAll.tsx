import type { FC } from "react";
import { Col, Row } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { LoadingIndicator } from "src/components/fragments";
import { useSearchAll } from "src/graphql";
import { GalleryCard } from "./GalleryCard";
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
  const hasGalleries = data.searchGalleries.galleries.length > 0;
  const columnWidth = hasGalleries ? 4 : 6;

  return (
    <Row>
      <Col xs={columnWidth}>
        <h3>Performers</h3>
        <div>
          {data.searchPerformers.performers.map((p) => (
            <PerformerCard performer={p} key={p.id} />
          ))}
        </div>
      </Col>
      <Col xs={columnWidth}>
        <h3>Scenes</h3>
        {data.searchScenes.scenes.map((s) => (
          <SceneCard scene={s} key={s.id} />
        ))}
      </Col>
      {hasGalleries && (
        <Col xs={4}>
          <h3>Galleries</h3>
          {data.searchGalleries.galleries.map((gallery) => (
            <GalleryCard gallery={gallery} key={gallery.id} />
          ))}
        </Col>
      )}
    </Row>
  );
};
