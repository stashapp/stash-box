import type { SearchSchemaInput } from "@tanstack/react-router";
import {
  CriterionModifier,
  type EditQueryInput,
  EditSortEnum,
  FavoriteFilter,
  OperationEnum,
  type SceneQueryInput,
  SceneSortEnum,
  SortDirectionEnum,
  TargetTypeEnum,
  UserVotedFilterEnum,
  VoteStatusEnum,
} from "src/graphql";

const text = (value: unknown) => (typeof value === "string" ? value : "");
const optionalEnum = <T extends string>(
  values: Record<string, T>,
  value: unknown,
) =>
  Object.values(values).find(
    (item) => item.toLowerCase() === text(value).toLowerCase(),
  );
const positivePage = (value: unknown) => {
  const page =
    typeof value === "string" || typeof value === "number" ? Number(value) : 1;
  return Number.isInteger(page) && page > 0 ? page : 1;
};
const boolean = (value: unknown, fallback: boolean) =>
  value === undefined || value === null || value === ""
    ? fallback
    : value === true || value === "true";

export interface SceneListOptions {
  perPage?: number;
  filter?: Partial<SceneQueryInput>;
  favoriteFilter?: "performer" | "studio" | "all";
  tagsFilter?: SceneQueryInput["tags"];
}

export function sceneListInput(
  search: Record<string, unknown>,
  { perPage = 20, filter, favoriteFilter, tagsFilter }: SceneListOptions = {},
): SceneQueryInput {
  return {
    page: positivePage(search.page),
    per_page: perPage,
    sort: optionalEnum(SceneSortEnum, search.sort) ?? SceneSortEnum.DATE,
    direction:
      optionalEnum(SortDirectionEnum, search.dir) ?? SortDirectionEnum.DESC,
    ...filter,
    favorites: favoriteFilter
      ? optionalEnum(FavoriteFilter, search.favorite)
      : undefined,
    tags:
      tagsFilter ||
      (text(search.tag)
        ? { value: [text(search.tag)], modifier: CriterionModifier.INCLUDES }
        : undefined),
  };
}

export function validateSceneListSearch(
  search: Record<string, unknown> & SearchSchemaInput,
) {
  return {
    page: positivePage(search.page),
    sort: optionalEnum(SceneSortEnum, search.sort) ?? SceneSortEnum.DATE,
    dir: optionalEnum(SortDirectionEnum, search.dir) ?? SortDirectionEnum.DESC,
    favorite: optionalEnum(FavoriteFilter, search.favorite),
    tag: text(search.tag) || undefined,
    fingerprint: text(search.fingerprint) || undefined,
  };
}

export function scenePageInput(
  search: ReturnType<typeof validateSceneListSearch>,
) {
  return sceneListInput(search, {
    favoriteFilter: "all",
    filter: search.fingerprint
      ? {
          fingerprints: {
            value: [search.fingerprint],
            modifier: CriterionModifier.INCLUDES,
          },
        }
      : undefined,
  });
}

export interface EditFilterOptions {
  sort?: EditSortEnum;
  direction?: SortDirectionEnum;
  type?: TargetTypeEnum;
  status?: VoteStatusEnum;
  operation?: OperationEnum;
  voted?: UserVotedFilterEnum;
  favorite?: boolean;
  bot?: boolean;
  userSubmitted?: boolean;
  defaultVoteStatus?: VoteStatusEnum | "all";
  defaultVoted?: UserVotedFilterEnum;
  defaultBot?: "include" | "exclude" | "only";
  defaultUserSubmitted?: boolean;
}

export const EDIT_PAGE_DEFAULTS = {
  defaultVoteStatus: VoteStatusEnum.PENDING,
  defaultVoted: UserVotedFilterEnum.NOT_VOTED,
  defaultBot: "exclude",
  defaultUserSubmitted: true,
} as const;

export function editFilterValues(
  search: Record<string, unknown>,
  options: EditFilterOptions = {},
) {
  const status = search.status || options.defaultVoteStatus;
  const voted = search.voted || options.defaultVoted;
  return {
    selectedSort:
      options.sort ??
      optionalEnum(EditSortEnum, search.sort) ??
      EditSortEnum.CREATED_AT,
    selectedDirection:
      options.direction ??
      optionalEnum(SortDirectionEnum, search.dir) ??
      SortDirectionEnum.DESC,
    selectedStatus: options.status ?? optionalEnum(VoteStatusEnum, status),
    selectedType: options.type ?? optionalEnum(TargetTypeEnum, search.type),
    selectedOperation:
      options.operation ?? optionalEnum(OperationEnum, search.operation),
    selectedVoted: options.voted ?? optionalEnum(UserVotedFilterEnum, voted),
    selectedFavorite: options.favorite ?? boolean(search.favorite, false),
    selectedBot:
      options.bot ?? (text(search.bot) || options.defaultBot || "include"),
    selectedUserSubmitted:
      options.userSubmitted ??
      boolean(search.user_submitted, options.defaultUserSubmitted ?? true),
  };
}

export function editListInput(
  values: ReturnType<typeof editFilterValues>,
  {
    page = 1,
    id,
    userId,
  }: { page?: number; id?: string; userId?: string } = {},
): EditQueryInput {
  return {
    target_type: values.selectedType,
    target_id: id,
    status: values.selectedStatus,
    operation: values.selectedOperation,
    voted: values.selectedVoted,
    user_id: userId,
    is_favorite: values.selectedFavorite,
    is_bot:
      values.selectedBot === "only"
        ? true
        : values.selectedBot === "exclude"
          ? false
          : undefined,
    page: positivePage(page),
    per_page: 20,
    sort: values.selectedSort,
    direction: values.selectedDirection,
    include_user_submitted: values.selectedUserSubmitted,
  };
}

export function validateEditListSearch(
  search: Record<string, unknown> & SearchSchemaInput,
) {
  const values = editFilterValues(search, EDIT_PAGE_DEFAULTS);
  return {
    page: positivePage(search.page),
    sort: values.selectedSort,
    dir: values.selectedDirection,
    status: values.selectedStatus ?? "all",
    voted: values.selectedVoted ?? "all",
    type: values.selectedType,
    operation: values.selectedOperation,
    favorite: values.selectedFavorite,
    bot:
      values.selectedBot === "only" || values.selectedBot === "include"
        ? values.selectedBot
        : "exclude",
    user_submitted: values.selectedUserSubmitted,
  };
}

export const editPageInput = (
  search: ReturnType<typeof validateEditListSearch>,
) =>
  editListInput(editFilterValues(search, EDIT_PAGE_DEFAULTS), {
    page: search.page,
  });
