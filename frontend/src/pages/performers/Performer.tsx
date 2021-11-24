import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { Tab, Tabs } from "react-bootstrap";
import { groupBy, keyBy, sortBy } from "lodash";

import {
  useEdits,
  useFullPerformer,
  CriterionModifier,
  TargetTypeEnum,
  VoteStatusEnum,
} from "src/graphql";

import { formatPendingEdits } from "src/utils";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { EditList, SceneList } from "src/components/list";
import CheckboxSelect from "src/components/checkboxSelect";
import PerformerInfo from "./performerInfo";

const DEFAULT_TAB = "scenes";

const PerformerComponent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const activeTab = history.location.hash?.slice(1) || DEFAULT_TAB;
  const { loading, data } = useFullPerformer({ id });
  const [studioFilter, setStudioFilter] = useState<string[] | null>(null);

  // Clear studio filter on performer change
  useEffect(() => {
    setStudioFilter(null);
  }, [id]);

  const { data: editData } = useEdits({
    filter: {
      per_page: 1,
    },
    editFilter: {
      target_type: TargetTypeEnum.PERFORMER,
      target_id: id,
      status: VoteStatusEnum.PENDING,
    },
  });
  const pendingEditCount = editData?.queryEdits.count;

  const setTab = (tab: string | null) =>
    history.push({ hash: tab === DEFAULT_TAB ? "" : `#${tab}` });

  if (loading) return <LoadingIndicator message="Loading performer..." />;
  if (!data?.findPerformer)
    return <ErrorMessage error="Failed to load performer." />;

  const studios = keyBy(data.findPerformer.studios, (s) => s.studio.id);
  const studioGroups = groupBy(
    data.findPerformer.studios,
    (s) => s.studio.parent?.id ?? "none"
  );
  const obj = sortBy(
    [
      ...(studioGroups.none ?? [])
        .filter((s) => !studioGroups[s.studio.id])
        .map((s) => ({
          label: `${s.studio.name} (${s.scene_count})`,
          value: s.studio.id,
          subValues: [],
        })),
      ...Object.keys(studioGroups)
        .filter((key) => key !== "none")
        .map((key) => {
          const group = studioGroups[key];
          const { parent } = group[0].studio;
          const parentSceneCount = studios[parent?.id ?? ""]?.scene_count ?? 0;
          const parentSceneCountText = parentSceneCount
            ? ` (${parentSceneCount})`
            : "";
          return {
            label: `${parent?.name ?? "Unknown"}${parentSceneCountText}`,
            value: parent?.id ?? "Unknown",
            subValues: sortBy(
              group.map((s) => ({
                label: `${s.studio.name} (${s.scene_count})`,
                value: s.studio.id,
                subValues: null,
              })),
              (s) => s.label
            ),
          };
        }),
    ],
    (s) => s.label
  )
    .map((s) => [
      { ...s, subValues: s.subValues.map((v) => v.value) },
      ...s.subValues,
    ])
    .flat();

  const handleStudioSelect = (selected: string[]) => {
    setStudioFilter(selected.length === 0 ? null : selected);
  };

  return (
    <>
      <div className="performer-info">
        <PerformerInfo performer={data.findPerformer} />
      </div>
      <hr className="my-2" />
      <Tabs activeKey={activeTab} id="tag-tabs" mountOnEnter onSelect={setTab}>
        <Tab eventKey="scenes" title="Scenes" className="PerformerScenes">
          <CheckboxSelect
            values={obj}
            onChange={handleStudioSelect}
            placeholder="Filter by studios"
            plural="studios"
            key={`performer-${id}-studio-select`}
          />
          <SceneList
            perPage={40}
            filter={{
              performers: { value: [id], modifier: CriterionModifier.INCLUDES },
              ...(studioFilter
                ? {
                    studios: {
                      value: studioFilter,
                      modifier: CriterionModifier.INCLUDES,
                    },
                  }
                : {}),
            }}
          />
        </Tab>
        <Tab
          eventKey="edits"
          title={`Edits${formatPendingEdits(pendingEditCount)}`}
          tabClassName={pendingEditCount ? "PendingEditTab" : ""}
        >
          <EditList type={TargetTypeEnum.PERFORMER} id={id} />
        </Tab>
      </Tabs>
    </>
  );
};

export default PerformerComponent;
