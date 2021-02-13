import React from "react";
import { useQuery } from "@apollo/client";
import { useParams, useHistory } from "react-router-dom";
import { Tab, Tabs } from "react-bootstrap";
import { loader } from "graphql.macro";

import { Performer } from "src/definitions/Performer";
import { CriterionModifier, TargetTypeEnum } from "src/definitions/globalTypes";

import PerformerInfo from "src/components/performerInfo";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { EditList } from "src/components/list";
import { SceneList } from "src/components/list";

const PerformerQuery = loader("src/queries/Performer.gql");

const DEFAULT_TAB = "scenes";

const PerformerComponent: React.FC = () => {
  const { id } = useParams();
  const history = useHistory();
  const activeTab = history.location.hash?.slice(1) || DEFAULT_TAB;
  const { loading, data } = useQuery<Performer>(PerformerQuery, {
    variables: { id },
  });

  const setTab = (tab: string | null) =>
    history.push({ hash: tab === DEFAULT_TAB ? "" : `#${tab}` });

  if (loading) return <LoadingIndicator message="Loading performer..." />;
  if (!data?.findPerformer)
    return <ErrorMessage error="Failed to load performer." />;

  return (
    <>
      <div className="performer-info">
        <PerformerInfo performer={data.findPerformer} />
      </div>
      <hr className="my-2" />
      <Tabs activeKey={activeTab} id="tag-tabs" mountOnEnter onSelect={setTab}>
        <Tab eventKey="scenes" title="Scenes">
          <SceneList
            perPage={40}
            filter={{
              performers: { value: [id], modifier: CriterionModifier.INCLUDES },
            }}
          />
        </Tab>
        <Tab eventKey="edits" title="Edits">
          <EditList type={TargetTypeEnum.PERFORMER} id={id} />
        </Tab>
      </Tabs>
    </>
  );
};

export default PerformerComponent;
