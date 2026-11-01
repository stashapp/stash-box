import type {
  EditsQuery,
  QuerySceneFragment,
  SceneCountQuery,
  ScenesQuery,
} from "src/graphql";

export function makeListScene(
  overrides: Partial<QuerySceneFragment> = {},
): QuerySceneFragment {
  return {
    __typename: "Scene",
    id: "scene-1",
    title: "First scene",
    release_date: null,
    duration: null,
    studio: null,
    urls: [],
    images: [],
    performers: [],
    ...overrides,
  };
}

export const makeScenesResult = (
  scenes: QuerySceneFragment[] = [],
): ScenesQuery => ({
  __typename: "Query",
  queryScenes: { __typename: "QueryScenesResultType", scenes },
});
export const makeSceneCountResult = (count = 0): SceneCountQuery => ({
  __typename: "Query",
  queryScenes: { __typename: "QueryScenesResultType", count },
});
export const makeEmptyEditsResult = (): EditsQuery => ({
  __typename: "Query",
  queryEdits: { __typename: "QueryEditsResultType", count: 0, edits: [] },
});
