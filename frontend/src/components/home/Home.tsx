import React from "react";
import { useQuery } from "@apollo/react-hooks";

import ScenesQuery from "src/queries/Scenes.gql";
import PerformersQuery from "src/queries/Performers.gql";
import { Scenes, ScenesVariables } from "src/definitions/Scenes";
import { Performers, PerformersVariables } from "src/definitions/Performers";
import { SortDirectionEnum } from "src/definitions/globalTypes";

import PerformerCard from "src/components/performerCard";
import SceneCard from "src/components/sceneCard";
import { LoadingIndicator } from "src/components/fragments";

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

  const scenes = loadingScenes ? (
    <LoadingIndicator message="Loading scenes..." />
  ) : (
    sceneData.queryScenes.scenes.map((scene) => (
      <SceneCard key={scene.id} performance={scene} />
    ))
  );

  const performers = loadingPerformers ? (
    <LoadingIndicator message="Loading performers" />
  ) : (
    performerData.queryPerformers.performers.map((performer) => (
      <PerformerCard key={performer.id} performer={performer} />
    ))
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
