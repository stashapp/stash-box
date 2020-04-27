import React from "react";
import { useQuery } from "@apollo/react-hooks";
import { useParams } from "react-router-dom";

import { Performer } from "src/definitions/Performer";
import PerformerQuery from "src/queries/Performer.gql";
import { Scenes } from "src/definitions/Scenes";
import ScenesQuery from "src/queries/Scenes.gql";

import PerformerInfo from "src/components/performerInfo";
import SceneCard from "src/components/sceneCard";
import { LoadingIndicator } from "src/components/fragments";

const PerformerComponent: React.FC = () => {
  const { id } = useParams();
  const { loading, data } = useQuery<Performer>(PerformerQuery, {
    variables: { id },
  });
  const { loading: loadingPerformances, data: performances } = useQuery<Scenes>(
    ScenesQuery,
    {
      variables: {
        sceneFilter: { performers: { value: [id], modifier: "INCLUDES" } },
        filter: { per_page: 1000 },
      },
    }
  );

  if (loading || loadingPerformances)
    return <LoadingIndicator message="Loading performer..." />;

  const scenes = performances.queryScenes.scenes
    .sort((a, b) => {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      return -1;
    })
    .map((p) => <SceneCard key={p.id} performance={p} />);

  return (
    <>
      <div className="performer-info">
        <PerformerInfo performer={data.findPerformer} />
      </div>
      <hr />
      <div className="row performer-scenes">{scenes}</div>
    </>
  );
};

export default PerformerComponent;
