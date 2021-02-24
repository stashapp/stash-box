/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TagCategoryUpdateInput, TagGroupEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateTagCategory
// ====================================================

export interface UpdateTagCategory_tagCategoryUpdate {
  __typename: "TagCategory";
  id: string;
  name: string;
  description: string | null;
  group: TagGroupEnum;
}

export interface UpdateTagCategory {
  tagCategoryUpdate: UpdateTagCategory_tagCategoryUpdate | null;
}

export interface UpdateTagCategoryVariables {
  categoryData: TagCategoryUpdateInput;
}
