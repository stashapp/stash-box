import { groupBy, keyBy, sortBy } from "lodash-es";
import type { FC } from "react";
import { Tab, Tabs } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import CheckboxSelect from "src/components/checkboxSelect";
import { EditList, GalleryList, SceneList, URLList } from "src/components/list";
import {
  CriterionModifier,
  type FullPerformerQuery,
  TargetTypeEnum,
  usePendingEditsCount,
} from "src/graphql";
import { useQueryParams } from "src/hooks";
import { formatPendingEdits } from "src/utils";
import { GalleryPairings, PerformerInfo, ScenePairings } from "./components";

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
        .filter((s) => s.scene_count > 0)
        .map((s) => ({
          label: `${s.studio.name} (${s.scene_count})`,
          value: s.studio.id,
          subValues: [],
        })),
      ...Object.keys(studioGroups)
        .filter((key) => key !== "none")
        .flatMap((key) => {
          const group = studioGroups[key].filter(
            (studio) => studio.scene_count > 0,
          );
          if (group.length === 0) return [];
          const { parent } = group[0].studio;
          const parentSceneCount = studios[parent?.id ?? ""]?.scene_count ?? 0;
          const parentSceneCountText = parentSceneCount
            ? ` (${parentSceneCount})`
            : "";
          return [
            {
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
            },
          ];
        }),
    ],
    (s) => s.label,
  ).flatMap((s) => [
    { ...s, subValues: s.subValues.map((v) => v.value) },
    ...s.subValues,
  ]);
  const galleryObj = sortBy(
    [
      ...(studioGroups.none ?? [])
        .filter((studio) => !studioGroups[studio.studio.id])
        .filter((studio) => studio.gallery_count > 0)
        .map((studio) => ({
          label: `${studio.studio.name} (${studio.gallery_count})`,
          value: studio.studio.id,
          subValues: [],
        })),
      ...Object.keys(studioGroups)
        .filter((key) => key !== "none")
        .flatMap((key) => {
          const group = studioGroups[key].filter(
            (studio) => studio.gallery_count > 0,
          );
          if (group.length === 0) return [];
          const { parent } = group[0].studio;
          const parentGalleryCount =
            studios[parent?.id ?? ""]?.gallery_count ?? 0;
          const parentCountText = parentGalleryCount
            ? ` (${parentGalleryCount})`
            : "";
          return [
            {
              label: `${parent?.name ?? "Unknown"}${parentCountText}`,
              value: parent?.id ?? "Unknown",
              subValues: sortBy(
                group.map((studio) => ({
                  label: `${studio.studio.name} (${studio.gallery_count})`,
                  value: studio.studio.id,
                  subValues: null,
                })),
                (studio) => studio.label,
              ),
            },
          ];
        }),
    ],
    (studio) => studio.label,
  ).flatMap((studio) => [
    {
      ...studio,
      subValues: studio.subValues.map((value) => value.value),
    },
    ...studio.subValues,
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
        <Tab eventKey="scenes" title="Scenes" className="PerformerEntityList">
          <CheckboxSelect
            values={obj}
            onChange={(ids) => setParams("studioFilter", ids)}
            placeholder="Filter by studios"
            plural="studios"
            key={`performer-${performer.id}-studio-select`}
            selected={studioFilter}
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
        <Tab
          eventKey="galleries"
          title="Galleries"
          className="PerformerEntityList"
        >
          <CheckboxSelect
            values={galleryObj}
            onChange={(ids) => setParams("studioFilter", ids)}
            placeholder="Filter by studios"
            plural="studios"
            key={`performer-${performer.id}-gallery-studio-select`}
            selected={studioFilter}
          />
          <GalleryList
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
            key={`performer-${performer.id}-gallery-list`}
          />
        </Tab>
        <Tab eventKey="galleryPairings" title="Gallery Pairings">
          <GalleryPairings id={performer.id} />
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
