/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: SearchTags
// ====================================================

export interface SearchTags_searchTag {
  __typename: "Tag";
  deleted: boolean;
  id: string;
  name: string;
  description: string | null;
  aliases: string[];
}

export interface SearchTags {
  searchTag: SearchTags_searchTag[];
}

export interface SearchTagsVariables {
  term: string;
  limit?: number | null;
}
