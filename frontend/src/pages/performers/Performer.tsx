import type { FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tab, Tabs } from "react-bootstrap";
import { groupBy, keyBy, sortBy } from "lodash-es";

import {
  usePendingEditsCount,
  CriterionModifier,
  TargetTypeEnum,
  type FullPerformerQuery,
} from "src/graphql";

import { formatPendingEdits } from "src/utils";
import { EditList, SceneList, URLList } from "src/components/list";
import CheckboxSelect from "src/components/checkboxSelect";
import { useQueryParams } from "src/hooks";
import { PerformerInfo, ScenePairings } from "./components";

type Performer = NonNullable<FullPerformerQuery["findPerformer"]>;

const DEFAULT_TAB = "scenes";

interface Props {
  performer: Performer;
}

const PerformerComponent: FC<Props> = ({ performer }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.hash?.slice(1) || DEFAULT_TAB;
  const [{ studioFilter }, setParams] = useQueryParams({
    studioFilter: { name: "studios", type: "string[]" },
  });

  const { data: editData } = usePendingEditsCount({
    type: TargetTypeEnum.PERFORMER,
    id: performer.id,
  });
  const pendingEditCount = editData?.queryEdits.count;

  const setTab = (tab: string | null) =>
    navigate({ hash: tab === DEFAULT_TAB ? "" : `#${tab}` });

  const studios = keyBy(performer.studios, (s) => s.studio.id);
  const studioGroups = groupBy(
    performer.studios,
    (s) => s.studio.parent?.id ?? "none",
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
              (s) => s.label,
            ),
          };
        }),
    ],
    (s) => s.label,
  ).flatMap((s) => [
    { ...s, subValues: s.subValues.map((v) => v.value) },
    ...s.subValues,
  ]);

  return (
    <>
      <PerformerInfo performer={performer} />
      <hr className="my-2" />
      <Tabs
        activeKey={activeTab}
        id="performer-tabs"
        mountOnEnter
        onSelect={setTab}
      >
        <Tab eventKey="scenes" title="Scenes" className="PerformerScenes">
          <CheckboxSelect
            values={obj}
            onChange={(ids) => setParams("studioFilter", ids)}
            placeholder="Filter by studios"
            plural="studios"
            key={`performer-${performer.id}-studio-select`}
            initialSelected={studioFilter}
          />
          <SceneList
            perPage={40}
            filter={{
              performers: {
                value: [performer.id],
                modifier: CriterionModifier.INCLUDES,
              },
              ...(studioFilter
                ? {
                    studios: {
                      value: studioFilter,
                      modifier: CriterionModifier.INCLUDES,
                    },
                  }
                : {}),
            }}
            favoriteFilter={"studio"}
            key={`performer-${performer.id}-scene-list`}
          />
        </Tab>
        <Tab eventKey="scenePairings" title="Scene Pairings">
          <ScenePairings id={performer.id} />
        </Tab>
        <Tab eventKey="links" title="Links">
          <URLList urls={performer.urls} />
        </Tab>
        <Tab
          eventKey="edits"
          title={`Edits${formatPendingEdits(pendingEditCount)}`}
          tabClassName={pendingEditCount ? "PendingEditTab" : ""}
        >
          <EditList type={TargetTypeEnum.PERFORMER} id={performer.id} />
        </Tab>
      </Tabs>
    </>
  );
};

export default PerformerComponent;
