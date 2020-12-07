import React from "react";
import { useQuery } from "@apollo/client";
import { useParams, useHistory } from "react-router-dom";
import { Tab, Tabs } from "react-bootstrap";
import { loader } from "graphql.macro";

import { Performer } from "src/definitions/Performer";
import { Scenes, ScenesVariables } from "src/definitions/Scenes";
import { CriterionModifier, TargetTypeEnum } from "src/definitions/globalTypes";

import PerformerInfo from "src/components/performerInfo";
import SceneCard from "src/components/sceneCard";
import Pagination from "src/components/pagination";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { usePagination } from "src/hooks";
import EditList from "src/components/editList";

const PerformerQuery = loader("src/queries/Performer.gql");
const ScenesQuery = loader("src/queries/Scenes.gql");

const PER_PAGE = 40;
const DEFAULT_TAB = "scenes";

const PerformerComponent: React.FC = () => {
  const { id } = useParams();
  const history = useHistory();
  const activeTab = history.location.hash?.slice(1) || DEFAULT_TAB;
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

  const setTab = (tab: string | null) =>
    history.push({ hash: tab === DEFAULT_TAB ? "" : `#${tab}` });

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
      <hr className="my-2" />
      <Tabs activeKey={activeTab} id="tag-tabs" mountOnEnter onSelect={setTab}>
        <Tab eventKey="scenes" title="Scenes">
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
        </Tab>
        <Tab eventKey="edits" title="Edits">
          <EditList type={TargetTypeEnum.PERFORMER} id={id} />
        </Tab>
      </Tabs>
    </>
  );
};

export default PerformerComponent;
