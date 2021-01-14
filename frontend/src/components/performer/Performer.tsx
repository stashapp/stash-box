import React from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { loader } from "graphql.macro";

import { Performer } from "src/definitions/Performer";
import { Scenes, ScenesVariables } from "src/definitions/Scenes";
import { CriterionModifier } from "src/definitions/globalTypes";

import PerformerInfo from "src/components/performerInfo";
import SceneCard from "src/components/sceneCard";
import Pagination from "src/components/pagination";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { usePagination } from "src/hooks";

const PerformerQuery = loader("src/queries/Performer.gql");
const ScenesQuery = loader("src/queries/Scenes.gql");

const PER_PAGE = 40;

const PerformerComponent: React.FC = () => {
  const { id } = useParams();
  const { page, setPage } = usePagination();
  const { loading, data } = useQuery<Performer>(PerformerQuery, {
    variables: { id },
  });
  const { loading: loadingPerformances, data: performances } = useQuery<
    Scenes,
    ScenesVariables
  >(ScenesQuery, {
    variables: {
      sceneFilter: {
        performers: { value: [id], modifier: CriterionModifier.INCLUDES },
      },
      filter: { per_page: PER_PAGE, page },
    },
  });

  if (loading) return <LoadingIndicator message="Loading performer..." />;
  if (!data?.findPerformer)
    return <ErrorMessage error="Failed to load performer." />;

  const scenes = (performances?.queryScenes?.scenes ?? []).map((p) => (
    <SceneCard key={p.id} performance={p} />
  ));

  return (
    <>
      <div className="performer-info">
        <PerformerInfo performer={data.findPerformer} />
      </div>
      <hr />
      {loadingPerformances ? (
        <LoadingIndicator message="Loading scene performances..." />
      ) : !performances ? (
        <ErrorMessage error="Failed to load scene performances." />
      ) : (
        <>
          <div className="ml-auto">
            <Pagination
              active={page}
              onClick={setPage}
              count={performances.queryScenes.count}
              perPage={PER_PAGE}
              showCount
            />
          </div>
          <div className="row performer-scenes">{scenes}</div>
          <Pagination
            active={page}
            onClick={setPage}
            count={performances.queryScenes.count}
            perPage={PER_PAGE}
          />
        </>
      )}
    </>
  );
};

export default PerformerComponent;
