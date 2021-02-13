import React from "react";
import { useQuery } from "@apollo/client";
import { loader } from "graphql.macro";
import { Col } from "react-bootstrap";

import { Scenes, ScenesVariables } from "src/definitions/Scenes";
import { Performers, PerformersVariables } from "src/definitions/Performers";
import { SortDirectionEnum } from "src/definitions/globalTypes";

import PerformerCard from "src/components/performerCard";
import SceneCard from "src/components/sceneCard";
import { LoadingIndicator } from "src/components/fragments";

const ScenesQuery = loader("src/queries/Scenes.gql");
const PerformersQuery = loader("src/queries/Performers.gql");

const ScenesComponent: React.FC = () => {
  const { loading: loadingScenes, data: sceneData } = useQuery<
    Scenes,
    ScenesVariables
  >(ScenesQuery, {
    variables: {
      filter: {
        page: 0,
        per_page: 8,
        sort: "DATE",
        direction: SortDirectionEnum.DESC,
      },
    },
  });
  const { loading: loadingPerformers, data: performerData } = useQuery<
    Performers,
    PerformersVariables
  >(PerformersQuery, {
    variables: {
      filter: {
        page: 0,
        per_page: 4,
        sort: "BIRTHDATE",
        direction: SortDirectionEnum.DESC,
      },
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
