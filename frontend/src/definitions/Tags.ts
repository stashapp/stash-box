/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { QuerySpec, TagFilterType } from "./globalTypes";

// ====================================================
// GraphQL query operation: Tags
// ====================================================

export interface Tags_queryTags_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface Tags_queryTags {
  __typename: "QueryTagsResultType";
  count: number;
  tags: Tags_queryTags_tags[];
}

export interface Tags {
  queryTags: Tags_queryTags;
}

export interface TagsVariables {
  filter?: QuerySpec | null;
  tagFilter?: TagFilterType | null;
}
