import React from "react";
import { Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

import { useScenes } from "src/graphql";

import SceneCard from "src/components/sceneCard";
import { LoadingIndicator, MarkdownDoc } from "src/components/fragments";
import { ROUTE_SCENES } from "src/constants";
import News from "docs/news.md";
import Intro from "docs/intro.md";

const CLASSNAME = 'HomePage';
const CLASSNAME_SCENES = `${CLASSNAME}-scenes`;

const ScenesComponent: React.FC = () => {
  const { loading: loadingScenes, data: sceneData } = useScenes({
    filter: {
      page: 1,
      per_page: 20,
      sort: "created_at",
    },
  });
  const { data: trendingData } = useScenes({
    filter: {
      page: 1,
      per_page: 20,
      sort: "trending",
    },
  });

  if (loadingScenes)
    return <LoadingIndicator message="Loading..." />;

  const scenes = (sceneData?.queryScenes?.scenes ?? []).map((scene) => (
    <Col key={scene.id}>
      <SceneCard performance={scene} />
    </Col>
  ));
  const trendingScenes = (trendingData?.queryScenes?.scenes ?? []).map((scene) => (
    <Col key={scene.id}>
      <SceneCard performance={scene} />
    </Col>
  ));

  return (
    <div className={CLASSNAME}>
			<Row>
        <Col xs={6}>
          <MarkdownDoc doc={News} />
        </Col>
        <Col xs={6}>
          <MarkdownDoc doc={Intro} />
        </Col>
      </Row>
      <h4>
        <Link to={`${ROUTE_SCENES}?sort=trending`}>Trending scenes</Link>
      </h4>
      <Row className={CLASSNAME_SCENES}>{trendingScenes}</Row>
      <h4>
        <Link to={`${ROUTE_SCENES}?sort=created_at`}>Recently added scenes</Link>
      </h4>
      <Row className={CLASSNAME_SCENES}>{scenes}</Row>
    </div>
  );
};

export default ScenesComponent;
