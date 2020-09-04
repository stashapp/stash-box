/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TagCategoryUpdateInput, TagGroupEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateTagCategoryMutation
// ====================================================

export interface UpdateTagCategoryMutation_tagCategoryUpdate {
  __typename: "TagCategory";
  id: string;
  name: string;
  description: string | null;
  group: TagGroupEnum;
}

export interface UpdateTagCategoryMutation {
  tagCategoryUpdate: UpdateTagCategoryMutation_tagCategoryUpdate | null;
}

export interface UpdateTagCategoryMutationVariables {
  categoryData: TagCategoryUpdateInput;
}
