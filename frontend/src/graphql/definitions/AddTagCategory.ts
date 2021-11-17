/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.


import { TagCategoryCreateInput, TagGroupEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddTagCategory
// ====================================================


export interface AddTagCategory_tagCategoryCreate {
  __typename: "TagCategory";
  id: string;
  name: string;
  description: string | null;
  group: TagGroupEnum;
}

export interface AddTagCategory {
  tagCategoryCreate: AddTagCategory_tagCategoryCreate | null;
}

export interface AddTagCategoryVariables {
  categoryData: TagCategoryCreateInput;
}
