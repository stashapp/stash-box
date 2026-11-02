import type { SearchSchemaInput } from "@tanstack/react-router";
import {
  EditSortEnum,
  FavoriteFilter,
  GenderFilterEnum,
  NotificationEnum,
  OperationEnum,
  PerformerSortEnum,
  SceneSortEnum,
  SortDirectionEnum,
  TargetTypeEnum,
  UserVotedFilterEnum,
  VoteStatusEnum,
} from "src/graphql";
import {
  searchBoolean,
  searchEnum,
  searchString,
  searchStrings,
} from "./search";

// Navigation accepts optional inputs; route hooks infer the validated output.
export const defineSearch =
  <T extends Record<string, unknown>>(
    validate: (search: Record<string, unknown>) => T,
  ) =>
  (search: Partial<T> & SearchSchemaInput) =>
    validate(search);

export const validatePaginationSearch = defineSearch((search) => {
  const page = Number(search.page ?? 1);
  return { page: Number.isInteger(page) && page > 0 ? page : 1 };
});

export const validateTextSearch = defineSearch((search) => ({
  query: searchString(search.query) ?? "",
}));

export const validateSceneSearch = defineSearch((search) => ({
  sort: searchEnum(SceneSortEnum, search.sort) ?? SceneSortEnum.DATE,
  dir: searchEnum(SortDirectionEnum, search.dir) ?? SortDirectionEnum.DESC,
  favorite: searchEnum(FavoriteFilter, search.favorite),
  tag: searchString(search.tag),
  fingerprint: searchString(search.fingerprint),
  studio: searchStrings(search.studio),
}));

const editSearch = (search: Record<string, unknown>) => ({
  operation: searchEnum(OperationEnum, search.operation),
  voted: searchEnum({ ...UserVotedFilterEnum, ALL: "all" }, search.voted),
  status: searchEnum({ ...VoteStatusEnum, ALL: "all" }, search.status),
  type: searchEnum(TargetTypeEnum, search.type),
  bot: searchEnum(
    { INCLUDE: "include", EXCLUDE: "exclude", ONLY: "only" },
    search.bot,
  ),
  user_submitted: searchBoolean(search.user_submitted),
});

export const validateEditSearch = defineSearch((search) => ({
  ...editSearch(search),
  sort: searchEnum(EditSortEnum, search.sort) ?? EditSortEnum.CREATED_AT,
  dir: searchEnum(SortDirectionEnum, search.dir) ?? SortDirectionEnum.DESC,
  favorite: searchBoolean(search.favorite),
}));

export const validatePerformerSearch = defineSearch((search) => ({
  query: searchString(search.query) ?? "",
  gender: searchEnum(GenderFilterEnum, search.gender),
  sort: searchEnum(PerformerSortEnum, search.sort) ?? PerformerSortEnum.NAME,
  dir: searchEnum(SortDirectionEnum, search.dir) ?? SortDirectionEnum.ASC,
  favorite: searchBoolean(search.favorite),
}));

// Entity pages host several independently filtered panels under the same URL.
// Leave panel-dependent defaults unset, and validate the union of their enums.
export const validateEntitySearch = defineSearch((search) => ({
  ...editSearch(search),
  query: searchString(search.query) ?? "",
  sort:
    searchEnum(SceneSortEnum, search.sort) ??
    searchEnum(EditSortEnum, search.sort) ??
    searchEnum(PerformerSortEnum, search.sort),
  dir: searchEnum(SortDirectionEnum, search.dir),
  favorite:
    searchEnum(FavoriteFilter, search.favorite) ??
    searchBoolean(search.favorite),
  gender: searchEnum(GenderFilterEnum, search.gender),
  scenes: searchBoolean(search.scenes),
  tag: searchString(search.tag),
  studios: searchStrings(search.studios),
}));

export const validateStudioSearch = defineSearch((search) => ({
  query: searchString(search.query) ?? "",
  favorite: searchBoolean(search.favorite),
  parents: searchBoolean(search.parents),
}));

export const validateImageReviewSearch = defineSearch((search) => ({
  performer: searchString(search.performer),
  user: searchString(search.user),
}));

export const validateNotificationSearch = defineSearch((search) => ({
  notification: searchEnum(NotificationEnum, search.notification),
  unread: searchBoolean(search.unread),
}));

export const validateEmailSearch = defineSearch((search) => ({
  key: searchString(search.key),
  submitted: searchBoolean(search.submitted),
}));

export const validateLoginSearch = defineSearch((search) => ({
  msg: searchString(search.msg),
  redirect: searchString(search.redirect),
}));

export const validateActivationSearch = defineSearch((search) => ({
  email: searchString(search.email),
  key: searchString(search.key),
}));

export const validateQuerySearch = defineSearch((search) => ({
  q: searchString(search.q),
}));
