import { useContext } from "react";
import {
  useQuery,
  useLazyQuery,
  QueryHookOptions,
  LazyQueryHookOptions,
} from "@apollo/client";

import AuthContext from "src/AuthContext";
import { isAdmin } from "src/utils";

import {
  CategoryDocument,
  CategoryQueryVariables,
  CategoriesDocument,
  EditDocument,
  EditQueryVariables,
  EditUpdateDocument,
  EditsDocument,
  EditsQueryVariables,
  MeDocument,
  MeQuery,
  PerformerDocument,
  PerformerQueryVariables,
  FullPerformerDocument,
  PerformersDocument,
  PerformersQueryVariables,
  SceneDocument,
  SceneQueryVariables,
  ScenesDocument,
  ScenesQueryVariables,
  ScenesWithoutCountDocument,
  SearchAllDocument,
  SearchAllQuery,
  SearchAllQueryVariables,
  SearchPerformersDocument,
  SearchPerformersQuery,
  SearchPerformersQueryVariables,
  SearchTagsDocument,
  SearchTagsQueryVariables,
  StudioDocument,
  StudioQueryVariables,
  StudiosDocument,
  StudiosQuery,
  StudiosQueryVariables,
  TagDocument,
  TagQueryVariables,
  TagsDocument,
  TagsQuery,
  TagsQueryVariables,
  UserDocument,
  UserQueryVariables,
  UsersDocument,
  UsersQueryVariables,
  PublicUserDocument,
  PublicUserQueryVariables,
  ConfigDocument,
  PendingEditsCountDocument,
  PendingEditsCountQueryVariables,
  SiteDocument,
  SiteQueryVariables,
  SitesDocument,
  DraftDocument,
  DraftQueryVariables,
  DraftsDocument,
  QueryExistingSceneDocument,
  QueryExistingSceneQueryVariables,
  QueryExistingPerformerDocument,
  QueryExistingPerformerQueryVariables,
  ScenePairingsDocument,
  ScenePairingsQueryVariables,
  StudioPerformersDocument,
  StudioPerformersQueryVariables,
  VersionDocument,
  MeQueryVariables,
} from "../types";

export const useCategory = (variables: CategoryQueryVariables, skip = false) =>
  useQuery(CategoryDocument, {
    variables,
    skip,
  });

export const useCategories = () => useQuery(CategoriesDocument);

export const useEdit = (variables: EditQueryVariables, skip = false) =>
  useQuery(EditDocument, {
    variables,
    skip,
  });

export const useEditUpdate = (variables: EditQueryVariables, skip = false) =>
  useQuery(EditUpdateDocument, {
    variables,
    skip,
  });

export const useEdits = (variables: EditsQueryVariables) =>
  useQuery(EditsDocument, {
    variables,
  });

export const useMe = (options?: QueryHookOptions<MeQuery, MeQueryVariables>) =>
  useQuery(MeDocument, options);

export const usePerformer = (
  variables: PerformerQueryVariables,
  skip = false,
) =>
  useQuery(PerformerDocument, {
    variables,
    skip,
  });

export const useFullPerformer = (
  variables: PerformerQueryVariables,
  skip = false,
) =>
  useQuery(FullPerformerDocument, {
    variables,
    skip,
  });

export const usePerformers = (variables: PerformersQueryVariables) =>
  useQuery(PerformersDocument, {
    variables,
  });

export const useScene = (variables: SceneQueryVariables, skip = false) =>
  useQuery(SceneDocument, {
    variables,
    skip,
  });

export const useScenes = (variables: ScenesQueryVariables, skip = false) =>
  useQuery(ScenesDocument, {
    variables,
    skip,
  });

export const useScenesWithoutCount = (
  variables: ScenesQueryVariables,
  skip = false,
) =>
  useQuery(ScenesWithoutCountDocument, {
    variables,
    skip,
  });

export const useSearchAll = (
  variables: SearchAllQueryVariables,
  skip = false,
) =>
  useQuery(SearchAllDocument, {
    variables,
    skip,
  });

export const useSearchPerformers = (
  variables: SearchPerformersQueryVariables,
) =>
  useQuery(SearchPerformersDocument, {
    variables,
  });

export const useLazySearchAll = (
  options?: LazyQueryHookOptions<SearchAllQuery, SearchAllQueryVariables>,
) => useLazyQuery(SearchAllDocument, options);

export const useLazySearchPerformers = (
  options?: LazyQueryHookOptions<
    SearchPerformersQuery,
    SearchPerformersQueryVariables
  >,
) => useLazyQuery(SearchPerformersDocument, options);

export const useSearchTags = (variables: SearchTagsQueryVariables) =>
  useQuery(SearchTagsDocument, {
    variables,
  });

export const useStudio = (variables: StudioQueryVariables, skip = false) =>
  useQuery(StudioDocument, {
    variables,
    skip,
  });

export const useStudios = (variables: StudiosQueryVariables) =>
  useQuery(StudiosDocument, {
    variables,
  });

export const useLazyStudios = (
  options?: LazyQueryHookOptions<StudiosQuery, StudiosQueryVariables>,
) => useLazyQuery(StudiosDocument, options);

export const useTag = (variables: TagQueryVariables, skip = false) =>
  useQuery(TagDocument, {
    variables,
    skip,
  });

export const useTags = (variables: TagsQueryVariables) =>
  useQuery(TagsDocument, {
    variables,
  });
export const useLazyTags = (
  options?: LazyQueryHookOptions<TagsQuery, TagsQueryVariables>,
) => useLazyQuery(TagsDocument, options);

export const usePrivateUser = (variables: UserQueryVariables, skip = false) =>
  useQuery(UserDocument, {
    variables,
    skip,
  });
export const usePublicUser = (
  variables: PublicUserQueryVariables,
  skip = false,
) =>
  useQuery(PublicUserDocument, {
    variables,
    skip,
  });

export const useUser = (variables: UserQueryVariables, skip = false) => {
  const Auth = useContext(AuthContext);
  const isUser = () => Auth.user?.name === variables.name;
  const showPrivate = isUser() || isAdmin(Auth.user);

  const privateUser = usePrivateUser(variables, skip || !showPrivate);
  const publicUser = usePublicUser(variables, skip || showPrivate);

  return showPrivate ? privateUser : publicUser;
};

export const useUsers = (variables: UsersQueryVariables) =>
  useQuery(UsersDocument, {
    variables,
  });

export const useConfig = () => useQuery(ConfigDocument);

export const useVersion = () => useQuery(VersionDocument);

export const usePendingEditsCount = (
  variables: PendingEditsCountQueryVariables,
) => useQuery(PendingEditsCountDocument, { variables });

export const useSite = (variables: SiteQueryVariables, skip = false) =>
  useQuery(SiteDocument, {
    variables,
    skip,
  });

export const useSites = () => useQuery(SitesDocument);

export const useDraft = (variables: DraftQueryVariables, skip = false) =>
  useQuery(DraftDocument, {
    variables,
    skip,
  });

export const useDrafts = () => useQuery(DraftsDocument);

export const useQueryExistingScene = (
  variables: QueryExistingSceneQueryVariables,
  skip = false,
) =>
  useQuery(QueryExistingSceneDocument, {
    variables,
    skip,
  });

export const useQueryExistingPerformer = (
  variables: QueryExistingPerformerQueryVariables,
  skip = false,
) =>
  useQuery(QueryExistingPerformerDocument, {
    variables,
    skip,
  });

export const useScenePairings = (variables: ScenePairingsQueryVariables) =>
  useQuery(ScenePairingsDocument, {
    variables,
  });

export const useStudioPerformers = (
  variables: StudioPerformersQueryVariables,
) =>
  useQuery(StudioPerformersDocument, {
    variables,
  });
