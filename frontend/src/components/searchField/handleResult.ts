import type { SearchAllQuery, SearchPerformersQuery } from "src/graphql";
import { filterData, formatDisambiguation } from "src/utils";

type SceneAllResult = NonNullable<SearchAllQuery["searchScene"][number]>;
type PerformerAllResult = NonNullable<
  SearchAllQuery["searchPerformer"][number]
>;
type PerformerOnlyResult = NonNullable<
  SearchPerformersQuery["searchPerformer"][number]
>;

export type PerformerResult = PerformerAllResult | PerformerOnlyResult;
export type SceneResult = SceneAllResult;

export interface SearchGroup {
  label: string;
  options: SearchResult[];
}

export interface SearchResult {
  type: string;
  value?: SceneResult | PerformerResult;
  label?: string;
  sublabel?: string;
}

interface PerformerSearchResult extends SearchResult {
  studioSceneCount: number;
}

const resultIsSearchAll = (
  result: SearchAllQuery | SearchPerformersQuery,
): result is SearchAllQuery =>
  (result as SearchAllQuery).searchScene !== undefined;

function formatPerformerLabel(performer: PerformerResult): string {
  return `${performer.name}${formatDisambiguation(performer)}`;
}

function formatPerformerSublabel(
  performer: PerformerResult,
  studioSceneCount?: number,
): string {
  const parts: (string | null)[] = [];

  if (studioSceneCount && studioSceneCount > 0) {
    parts.push(
      `${studioSceneCount} scene${studioSceneCount !== 1 ? "s" : ""} for network`,
    );
  }

  if (performer.birth_date) {
    parts.push(`Born: ${performer.birth_date}`);
  }

  if (performer.aliases.length) {
    parts.push(`AKA: ${performer.aliases.join(", ")}`);
  }

  return parts.filter(Boolean).join(", ");
}

function getStudioSceneCount(performer: PerformerOnlyResult): number {
  if ("studios" in performer && performer.studios?.length) {
    return performer.studios.reduce((sum, s) => sum + s.scene_count, 0);
  }
  return 0;
}

function formatSceneLabel(scene: SceneResult): string {
  return `${scene.title}${scene.release_date ? ` (${scene.release_date})` : ""}`;
}

function formatSceneSublabel(scene: SceneResult): string {
  return filterData([
    scene.studio?.name,
    scene.code ? `Code ${scene.code}` : null,
    scene.performers
      ? scene.performers.map((p) => p.as || p.performer.name).join(", ")
      : null,
  ]).join(" • ");
}

function handleSearchAllResult(
  result: SearchAllQuery,
  excludeIDs: string[],
): { performers: SearchResult[]; scenes: SearchResult[] } {
  const performers = (result.searchPerformer ?? [])
    .filter((p): p is PerformerAllResult => p !== null)
    .filter((performer) => !excludeIDs.includes(performer.id))
    .map(
      (performer): SearchResult => ({
        type: "performer",
        value: performer,
        label: formatPerformerLabel(performer),
        sublabel: formatPerformerSublabel(performer),
      }),
    );

  const scenes = (result.searchScene ?? [])
    .filter((s): s is SceneResult => s !== null)
    .filter((scene) => !excludeIDs.includes(scene.id))
    .map(
      (scene): SearchResult => ({
        type: "scene",
        value: scene,
        label: formatSceneLabel(scene),
        sublabel: formatSceneSublabel(scene),
      }),
    );

  return { performers, scenes };
}

function handlePerformerSearchResult(
  result: SearchPerformersQuery,
  excludeIDs: string[],
  studioId?: string,
): PerformerSearchResult[] {
  return (result.searchPerformer ?? [])
    .filter((p): p is PerformerOnlyResult => p !== null)
    .filter((performer) => !excludeIDs.includes(performer.id))
    .map((performer): PerformerSearchResult => {
      const studioSceneCount = studioId ? getStudioSceneCount(performer) : 0;
      return {
        type: "performer",
        value: performer,
        label: formatPerformerLabel(performer),
        sublabel: formatPerformerSublabel(performer, studioSceneCount),
        studioSceneCount,
      };
    });
}

function groupPerformersByStudio(
  performers: PerformerSearchResult[],
): SearchGroup[] {
  const studioPerformers = performers.filter((p) => p.studioSceneCount > 0);
  const otherPerformers = performers.filter((p) => p.studioSceneCount === 0);

  const groups: SearchGroup[] = [];

  if (studioPerformers.length > 0) {
    groups.push({ label: "Studio Performers", options: studioPerformers });
  }

  if (otherPerformers.length > 0) {
    const label =
      studioPerformers.length > 0 ? "Other Performers" : "Performers";
    groups.push({ label, options: otherPerformers });
  }

  return groups;
}

function createPerformerGroups(performers: SearchResult[]): SearchGroup[] {
  if (performers.length === 0) return [];
  return [{ label: "Performers", options: performers }];
}

function createSceneGroups(scenes: SearchResult[]): SearchGroup[] {
  if (scenes.length === 0) return [];
  return [{ label: "Scenes", options: scenes }];
}

export function handleResult(
  result: SearchAllQuery | SearchPerformersQuery,
  excludeIDs: string[],
  showAllLink: boolean,
  studioId?: string,
): (SearchGroup | SearchResult)[] {
  let performerGroups: SearchGroup[];
  let sceneGroups: SearchGroup[];

  if (resultIsSearchAll(result)) {
    const { performers, scenes } = handleSearchAllResult(result, excludeIDs);
    performerGroups = createPerformerGroups(performers);
    sceneGroups = createSceneGroups(scenes);
  } else {
    const performers = handlePerformerSearchResult(
      result,
      excludeIDs,
      studioId,
    );
    performerGroups = studioId
      ? groupPerformersByStudio(performers)
      : createPerformerGroups(performers);
    sceneGroups = [];
  }

  const hasResults = performerGroups.length > 0 || sceneGroups.length > 0;
  const showAll: SearchResult[] =
    showAllLink && hasResults
      ? [{ type: "ALL", label: "Show all results" }]
      : [];

  return [...showAll, ...performerGroups, ...sceneGroups];
}
