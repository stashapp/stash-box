import React from "react";
import { useParams, useHistory } from "react-router-dom";
import { Tab, Tabs } from "react-bootstrap";

import { usePerformer, CriterionModifier, TargetTypeEnum } from "src/graphql";

import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { EditList, SceneList } from "src/components/list";
import PerformerInfo from "./performerInfo";

const DEFAULT_TAB = "scenes";

const PerformerComponent: React.FC = () => {
  const { id } = useParams();
  const history = useHistory();
  const activeTab = history.location.hash?.slice(1) || DEFAULT_TAB;
  const { loading, data } = usePerformer({ id });

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
