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
  CategoryQuery,
  CategoryQueryVariables,
  CategoriesQuery,
  EditQuery,
  EditQueryVariables,
  EditUpdateQuery,
  EditUpdateQueryVariables,
  EditsQuery,
  EditsQueryVariables,
  MeQuery,
  PerformerQuery,
  PerformerQueryVariables,
  FullPerformerQuery,
  FullPerformerQueryVariables,
  PerformersQuery,
  PerformersQueryVariables,
  SceneQuery,
  SceneQueryVariables,
  ScenesQuery,
  ScenesQueryVariables,
  ScenesWithoutCountQuery,
  ScenesWithoutCountQueryVariables,
  SearchAllQuery,
  SearchAllQueryVariables,
  SearchPerformersQuery,
  SearchPerformersQueryVariables,
  SearchTagsQuery,
  SearchTagsQueryVariables,
  StudioQuery,
  StudioQueryVariables,
  StudiosQuery,
  StudiosQueryVariables,
  TagQuery,
  TagQueryVariables,
  TagsQuery,
  TagsQueryVariables,
  UserQuery,
  UserQueryVariables,
  UsersQuery,
  UsersQueryVariables,
  PublicUserQuery,
  PublicUserQueryVariables,
  ConfigQuery,
  VersionQuery,
  PendingEditsCountQuery,
  PendingEditsCountQueryVariables,
  SiteQuery,
  SiteQueryVariables,
  SitesQuery,
  DraftQuery,
  DraftQueryVariables,
  DraftsQuery,
  QueryExistingSceneQuery,
  QueryExistingSceneQueryVariables,
} from "../types";

import CategoryGQL from "./Category.gql";
import CategoriesGQL from "./Categories.gql";
import EditGQL from "./Edit.gql";
import EditUpdateGQL from "./EditUpdate.gql";
import EditsGQL from "./Edits.gql";
import MeGQL from "./Me.gql";
import PerformerGQL from "./Performer.gql";
import FullPerformerGQL from "./FullPerformer.gql";
import PerformersGQL from "./Performers.gql";
import SceneGQL from "./Scene.gql";
import ScenesGQL from "./Scenes.gql";
import ScenesWithoutCountGQL from "./ScenesWithoutCount.gql";
import SearchAllGQL from "./SearchAll.gql";
import SearchPerformersGQL from "./SearchPerformers.gql";
import SearchTagsGQL from "./SearchTags.gql";
import StudioGQL from "./Studio.gql";
import StudiosGQL from "./Studios.gql";
import TagGQL from "./Tag.gql";
import TagsGQL from "./Tags.gql";
import UserGQL from "./User.gql";
import UsersGQL from "./Users.gql";
import PublicUserGQL from "./PublicUser.gql";
import ConfigGQL from "./Config.gql";
import VersionGQL from "./Version.gql";
import PendingEditsCountGQL from "./PendingEditsCount.gql";
import SiteGQL from "./Site.gql";
import SitesGQL from "./Sites.gql";
import DraftGQL from "./Draft.gql";
import DraftsGQL from "./Drafts.gql";
import QueryExistingSceneGQL from "./QueryExistingScene.gql";

export const useCategory = (variables: CategoryQueryVariables, skip = false) =>
  useQuery<CategoryQuery, CategoryQueryVariables>(CategoryGQL, {
    variables,
    skip,
  });

export const useCategories = () => useQuery<CategoriesQuery>(CategoriesGQL);

export const useEdit = (variables: EditQueryVariables, skip = false) =>
  useQuery<EditQuery, EditQueryVariables>(EditGQL, {
    variables,
    skip,
  });

export const useEditUpdate = (variables: EditQueryVariables, skip = false) =>
  useQuery<EditUpdateQuery, EditUpdateQueryVariables>(EditUpdateGQL, {
    variables,
    skip,
  });

export const useEdits = (variables: EditsQueryVariables) =>
  useQuery<EditsQuery, EditsQueryVariables>(EditsGQL, {
    variables,
  });

export const useMe = (options?: QueryHookOptions<MeQuery>) =>
  useQuery<MeQuery>(MeGQL, options);

export const usePerformer = (
  variables: PerformerQueryVariables,
  skip = false
) =>
  useQuery<PerformerQuery, PerformerQueryVariables>(PerformerGQL, {
    variables,
    skip,
  });

export const useFullPerformer = (
  variables: PerformerQueryVariables,
  skip = false
) =>
  useQuery<FullPerformerQuery, FullPerformerQueryVariables>(FullPerformerGQL, {
    variables,
    skip,
  });

export const usePerformers = (variables: PerformersQueryVariables) =>
  useQuery<PerformersQuery, PerformersQueryVariables>(PerformersGQL, {
    variables,
  });

export const useScene = (variables: SceneQueryVariables, skip = false) =>
  useQuery<SceneQuery, SceneQueryVariables>(SceneGQL, {
    variables,
    skip,
  });

export const useScenes = (variables: ScenesQueryVariables, skip = false) =>
  useQuery<ScenesQuery, ScenesQueryVariables>(ScenesGQL, {
    variables,
    skip,
  });

export const useScenesWithoutCount = (
  variables: ScenesQueryVariables,
  skip = false
) =>
  useQuery<ScenesWithoutCountQuery, ScenesWithoutCountQueryVariables>(
    ScenesWithoutCountGQL,
    {
      variables,
      skip,
    }
  );

export const useSearchAll = (
  variables: SearchAllQueryVariables,
  skip = false
) =>
  useQuery<SearchAllQuery, SearchAllQueryVariables>(SearchAllGQL, {
    variables,
    skip,
  });

export const useSearchPerformers = (
  variables: SearchPerformersQueryVariables
) =>
  useQuery<SearchPerformersQuery, SearchPerformersQueryVariables>(
    SearchPerformersGQL,
    {
      variables,
    }
  );

export const useLazySearchAll = (
  options?: LazyQueryHookOptions<SearchAllQuery, SearchAllQueryVariables>
) => useLazyQuery(SearchAllGQL, options);

export const useLazySearchPerformers = (
  options?: LazyQueryHookOptions<
    SearchPerformersQuery,
    SearchPerformersQueryVariables
  >
) => useLazyQuery(SearchPerformersGQL, options);

export const useSearchTags = (variables: SearchTagsQueryVariables) =>
  useQuery<SearchTagsQuery, SearchTagsQueryVariables>(SearchTagsGQL, {
    variables,
  });

export const useStudio = (variables: StudioQueryVariables, skip = false) =>
  useQuery<StudioQuery, StudioQueryVariables>(StudioGQL, {
    variables,
    skip,
  });

export const useStudios = (variables: StudiosQueryVariables) =>
  useQuery<StudiosQuery, StudiosQueryVariables>(StudiosGQL, {
    variables,
  });

export const useLazyStudios = (
  options?: LazyQueryHookOptions<StudiosQuery, StudiosQueryVariables>
) => useLazyQuery(StudiosGQL, options);

export const useTag = (variables: TagQueryVariables, skip = false) =>
  useQuery<TagQuery, TagQueryVariables>(TagGQL, {
    variables,
    skip,
  });

export const useTags = (variables: TagsQueryVariables) =>
  useQuery<TagsQuery, TagsQueryVariables>(TagsGQL, {
    variables,
  });
export const useLazyTags = (
  options?: LazyQueryHookOptions<TagsQuery, TagsQueryVariables>
) => useLazyQuery(TagsGQL, options);

export const usePrivateUser = (variables: UserQueryVariables, skip = false) =>
  useQuery<UserQuery, UserQueryVariables>(UserGQL, {
    variables,
    skip,
  });
export const usePublicUser = (
  variables: PublicUserQueryVariables,
  skip = false
) =>
  useQuery<PublicUserQuery, PublicUserQueryVariables>(PublicUserGQL, {
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
  useQuery<UsersQuery, UsersQueryVariables>(UsersGQL, {
    variables,
  });

export const useConfig = () => useQuery<ConfigQuery>(ConfigGQL);

export const useVersion = () => useQuery<VersionQuery>(VersionGQL);

export const usePendingEditsCount = (
  variables: PendingEditsCountQueryVariables
) =>
  useQuery<PendingEditsCountQuery, PendingEditsCountQueryVariables>(
    PendingEditsCountGQL,
    { variables }
  );

export const useSite = (variables: SiteQueryVariables, skip = false) =>
  useQuery<SiteQuery, SiteQueryVariables>(SiteGQL, {
    variables,
    skip,
  });

export const useSites = () => useQuery<SitesQuery>(SitesGQL);

export const useDraft = (variables: DraftQueryVariables, skip = false) =>
  useQuery<DraftQuery, DraftQueryVariables>(DraftGQL, {
    variables,
    skip,
  });

export const useDrafts = () => useQuery<DraftsQuery>(DraftsGQL);

export const useQueryExistingScene = (
  variables: QueryExistingSceneQueryVariables,
  skip = false
) =>
  useQuery<QueryExistingSceneQuery, QueryExistingSceneQueryVariables>(
    QueryExistingSceneGQL,
    {
      variables,
      skip,
    }
  );
