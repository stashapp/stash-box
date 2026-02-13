import { useLazyQuery, useQuery } from "@apollo/client/react";

import {
  CategoryDocument,
  type CategoryQueryVariables,
  CategoriesDocument,
  EditDocument,
  type EditQueryVariables,
  EditUpdateDocument,
  EditsDocument,
  type EditsQueryVariables,
  MeDocument,
  type MeQuery,
  PerformerDocument,
  type PerformerQueryVariables,
  FullPerformerDocument,
  PerformersDocument,
  type PerformersQueryVariables,
  SceneDocument,
  type SceneQueryVariables,
  ScenesDocument,
  type ScenesQueryVariables,
  ScenesWithFingerprintsDocument,
  type ScenesWithFingerprintsQueryVariables,
  ScenesWithoutCountDocument,
  SearchAllDocument,
  type SearchAllQuery,
  type SearchAllQueryVariables,
  SearchPerformersDocument,
  type SearchPerformersQuery,
  type SearchPerformersQueryVariables,
  SearchTagsDocument,
  type SearchTagsQueryVariables,
  StudioDocument,
  type StudioQueryVariables,
  StudiosDocument,
  type StudiosQuery,
  type StudiosQueryVariables,
  TagDocument,
  type TagQueryVariables,
  TagsDocument,
  type TagsQuery,
  type TagsQueryVariables,
  UserDocument,
  type UserQueryVariables,
  UsersDocument,
  type UsersQueryVariables,
  PublicUserDocument,
  type PublicUserQueryVariables,
  ConfigDocument,
  PendingEditsCountDocument,
  type PendingEditsCountQueryVariables,
  SiteDocument,
  type SiteQueryVariables,
  SitesDocument,
  DraftDocument,
  type DraftQueryVariables,
  DraftsDocument,
  QueryExistingSceneDocument,
  type QueryExistingSceneQueryVariables,
  QueryExistingPerformerDocument,
  type QueryExistingPerformerQueryVariables,
  ScenePairingsDocument,
  type ScenePairingsQueryVariables,
  StudioPerformersDocument,
  type StudioPerformersQueryVariables,
  VersionDocument,
  type MeQueryVariables,
  NotificationsDocument,
  type NotificationsQueryVariables,
  UnreadNotificationCountDocument,
  ModAuditsDocument,
  type ModAuditsQueryVariables,
} from "../types";
import { useCurrentUser } from "src/hooks";

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

export const useMe = (options?: useQuery.Options<MeQuery, MeQueryVariables>) =>
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

export const useScenesWithFingerprints = (
  variables: ScenesWithFingerprintsQueryVariables,
  skip = false,
) =>
  useQuery(ScenesWithFingerprintsDocument, {
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
  options?: useLazyQuery.Options<SearchAllQuery, SearchAllQueryVariables>,
) => useLazyQuery(SearchAllDocument, options);

export const useLazySearchPerformers = (
  options?: useLazyQuery.Options<
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
  options?: useLazyQuery.Options<StudiosQuery, StudiosQueryVariables>,
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
  options?: useLazyQuery.Options<TagsQuery, TagsQueryVariables>,
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
  const { isAdmin, user } = useCurrentUser();
  const isUser = () => user?.name === variables.name;
  const showPrivate = isUser() || isAdmin;

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

export const useNotifications = (variables: NotificationsQueryVariables) =>
  useQuery(NotificationsDocument, {
    variables,
  });

export const useUnreadNotificationsCount = () =>
  useQuery(UnreadNotificationCountDocument);

export const useModAudits = (variables: ModAuditsQueryVariables) =>
  useQuery(ModAuditsDocument, {
    variables,
  });
