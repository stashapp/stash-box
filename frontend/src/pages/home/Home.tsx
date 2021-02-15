import React from "react";
import { Col } from "react-bootstrap";

import { useScenes, usePerformers, SortDirectionEnum } from "src/graphql";

import PerformerCard from "src/components/performerCard";
import SceneCard from "src/components/sceneCard";
import { LoadingIndicator } from "src/components/fragments";

const ScenesComponent: React.FC = () => {
  const { loading: loadingScenes, data: sceneData } = useScenes({
    filter: {
      page: 0,
      per_page: 8,
      sort: "DATE",
      direction: SortDirectionEnum.DESC,
    },
  });
  const { loading: loadingPerformers, data: performerData } = usePerformers({
    filter: {
      page: 0,
      per_page: 4,
      sort: "BIRTHDATE",
      direction: SortDirectionEnum.DESC,
    },
  });

  if (loadingScenes && loadingPerformers)
    return <LoadingIndicator message="Loading..." />;

  const scenes = (sceneData?.queryScenes?.scenes ?? []).map((scene) => (
    <SceneCard key={scene.id} performance={scene} />
  ));

  const performers = (performerData?.queryPerformers?.performers ?? []).map(
    (performer) => (
      <Col xs={3} key={performer.id}>
        <PerformerCard performer={performer} />
      </Col>
    )
  );

  return (
    <>
      <div className="scenes">
        <h4>New scenes:</h4>
        <div className="row">{scenes}</div>
      </div>
      <div className="performers">
        <h4>New performers:</h4>
        <div className="row">{performers}</div>
      </div>
    </>
  );
};

export default ScenesComponent;
