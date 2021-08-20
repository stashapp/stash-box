import {
  useQuery,
  useLazyQuery,
  QueryHookOptions,
  LazyQueryHookOptions,
} from "@apollo/client";
import { loader } from "graphql.macro";

import { Category, CategoryVariables } from "../definitions/Category";
import { Categories, CategoriesVariables } from "../definitions/Categories";
import { Edit, EditVariables } from "../definitions/Edit";
import { Edits, EditsVariables } from "../definitions/Edits";
import { Me } from "../definitions/Me";
import { Performer, PerformerVariables } from "../definitions/Performer";
import {
  FullPerformer,
  FullPerformerVariables,
} from "../definitions/FullPerformer";
import { Performers, PerformersVariables } from "../definitions/Performers";
import { Scene, SceneVariables } from "../definitions/Scene";
import { Scenes, ScenesVariables } from "../definitions/Scenes";
import { SearchAll, SearchAllVariables } from "../definitions/SearchAll";
import {
  SearchPerformers,
  SearchPerformersVariables,
} from "../definitions/SearchPerformers";
import { Studio, StudioVariables } from "../definitions/Studio";
import { Studios, StudiosVariables } from "../definitions/Studios";
import { Tag, TagVariables } from "../definitions/Tag";
import { Tags, TagsVariables } from "../definitions/Tags";
import { User, UserVariables } from "../definitions/User";
import { Users, UsersVariables } from "../definitions/Users";
import {
  ImportScenes,
  ImportScenesVariables,
} from "../definitions/ImportScenes";
import { ImportSceneMappings } from "../definitions/ImportSceneMappings";

const CategoryQuery = loader("./Category.gql");
const CategoriesQuery = loader("./Categories.gql");
const EditQuery = loader("./Edit.gql");
const EditsQuery = loader("./Edits.gql");
const MeQuery = loader("./Me.gql");
const PerformerQuery = loader("./Performer.gql");
const FullPerformerQuery = loader("./FullPerformer.gql");
const PerformersQuery = loader("./Performers.gql");
const SceneQuery = loader("./Scene.gql");
const ScenesQuery = loader("./Scenes.gql");
const SearchAllQuery = loader("./SearchAll.gql");
const SearchPerformersQuery = loader("./SearchPerformers.gql");
const StudioQuery = loader("./Studio.gql");
const StudiosQuery = loader("./Studios.gql");
const TagQuery = loader("./Tag.gql");
const TagsQuery = loader("./Tags.gql");
const UserQuery = loader("./User.gql");
const UsersQuery = loader("./Users.gql");
const ImportScenesQuery = loader("./ImportScenes.gql");
const ImportSceneMappingsQuery = loader("./ImportSceneMappings.gql");

export const useCategory = (
  variables: CategoryVariables,
  skip: boolean = false
) =>
  useQuery<Category, CategoryVariables>(CategoryQuery, {
    variables,
    skip,
  });

export const useCategories = (variables?: CategoriesVariables) =>
  useQuery<Categories, CategoriesVariables>(CategoriesQuery, {
    variables,
  });

export const useEdit = (variables: EditVariables) =>
  useQuery<Edit, EditVariables>(EditQuery, {
    variables,
  });

export const useEdits = (variables: EditsVariables) =>
  useQuery<Edits, EditsVariables>(EditsQuery, {
    variables,
  });

export const useMe = (options?: QueryHookOptions<Me>) =>
  useQuery<Me>(MeQuery, options);

export const usePerformer = (
  variables: PerformerVariables,
  skip: boolean = false
) =>
  useQuery<Performer, PerformerVariables>(PerformerQuery, {
    variables,
    skip,
  });

export const useFullPerformer = (
  variables: PerformerVariables,
  skip: boolean = false
) =>
  useQuery<FullPerformer, FullPerformerVariables>(FullPerformerQuery, {
    variables,
    skip,
  });

export const usePerformers = (variables: PerformersVariables) =>
  useQuery<Performers, PerformersVariables>(PerformersQuery, {
    variables,
  });

export const useScene = (variables: SceneVariables) =>
  useQuery<Scene, SceneVariables>(SceneQuery, {
    variables,
  });

export const useScenes = (variables: ScenesVariables, skip: boolean = false) =>
  useQuery<Scenes, ScenesVariables>(ScenesQuery, {
    variables,
    skip,
  });

export const useSearchAll = (
  variables: SearchAllVariables,
  skip: boolean = false
) =>
  useQuery<SearchAll, SearchAllVariables>(SearchAllQuery, {
    variables,
    skip,
  });

export const useSearchPerformers = (variables: SearchPerformersVariables) =>
  useQuery<SearchPerformers, SearchPerformersVariables>(SearchPerformersQuery, {
    variables,
  });

export const useLazySearchAll = (
  options?: LazyQueryHookOptions<SearchAll, SearchAllVariables>
) => useLazyQuery(SearchAllQuery, options);

export const useLazySearchPerformers = (
  options?: LazyQueryHookOptions<SearchPerformers, SearchPerformersVariables>
) => useLazyQuery(SearchPerformersQuery, options);

export const useStudio = (variables: StudioVariables, skip: boolean = false) =>
  useQuery<Studio, StudioVariables>(StudioQuery, {
    variables,
    skip,
  });

export const useStudios = (variables: StudiosVariables) =>
  useQuery<Studios, StudiosVariables>(StudiosQuery, {
    variables,
  });

export const useLazyStudios = (
  options?: LazyQueryHookOptions<Studios, StudiosVariables>
) => useLazyQuery(StudiosQuery, options);

export const useTag = (variables: TagVariables, skip: boolean = false) =>
  useQuery<Tag, TagVariables>(TagQuery, {
    variables,
    skip,
  });

export const useTags = (variables: TagsVariables) =>
  useQuery<Tags, TagsVariables>(TagsQuery, {
    variables,
  });
export const useLazyTags = (
  options?: LazyQueryHookOptions<Tags, TagsVariables>
) => useLazyQuery(TagsQuery, options);

export const useUser = (variables: UserVariables, skip: boolean = false) =>
  useQuery<User, UserVariables>(UserQuery, {
    variables,
    skip,
  });

export const useUsers = (variables: UsersVariables) =>
  useQuery<Users, UsersVariables>(UsersQuery, {
    variables,
  });

export const useImportScenes = (variables: ImportScenesVariables) =>
  useQuery<ImportScenes, ImportScenesVariables>(ImportScenesQuery, {
    variables,
  });

export const useImportSceneMappings = () =>
  useQuery<ImportSceneMappings>(ImportSceneMappingsQuery);
