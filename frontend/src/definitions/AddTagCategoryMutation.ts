/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TagCategoryCreateInput, TagGroupEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddTagCategoryMutation
// ====================================================

export interface AddTagCategoryMutation_tagCategoryCreate {
  __typename: "TagCategory";
  id: string;
  name: string;
  description: string | null;
  group: TagGroupEnum;
}

export interface AddTagCategoryMutation {
  tagCategoryCreate: AddTagCategoryMutation_tagCategoryCreate | null;
}

export interface AddTagCategoryMutationVariables {
  categoryData: TagCategoryCreateInput;
}
