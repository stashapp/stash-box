/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.


import { TagGroupEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: Tag
// ====================================================


export interface Tag_findTag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
  group: TagGroupEnum;
  description: string | null;
}

export interface Tag_findTag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  aliases: string[];
  deleted: boolean;
  category: Tag_findTag_category | null;
}

export interface Tag {
  /**
   * Find a tag by ID or name, or aliases
   */
  findTag: Tag_findTag | null;
}

export interface TagVariables {
  name?: string | null;
  id?: string | null;
}
