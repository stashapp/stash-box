import React from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { loader } from "graphql.macro";

import { Performer } from "src/definitions/Performer";
import { Scenes, ScenesVariables } from "src/definitions/Scenes";
import { CriterionModifier } from "src/definitions/globalTypes";

import PerformerInfo from "src/components/performerInfo";
import SceneCard from "src/components/sceneCard";
import { LoadingIndicator } from "src/components/fragments";

const PerformerQuery = loader("src/queries/Performer.gql");
const ScenesQuery = loader("src/queries/Scenes.gql");

const PerformerComponent: React.FC = () => {
  const { id } = useParams();
  const { loading, data } = useQuery<Performer>(PerformerQuery, {
    variables: { id },
  });
  const { loading: loadingPerformances, data: performances } = useQuery<Scenes, ScenesVariables>(
    ScenesQuery,
    {
      variables: {
        sceneFilter: { performers: { value: [id], modifier: CriterionModifier.INCLUDES } },
        filter: { per_page: 1000 },
      },
    }
  );

  if (loading || loadingPerformances)
    return <LoadingIndicator message="Loading performer..." />;

  if (!data?.findPerformer) return <div>Performer not found.</div>;

  const scenes = [...(performances?.queryScenes?.scenes ?? [])]
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
