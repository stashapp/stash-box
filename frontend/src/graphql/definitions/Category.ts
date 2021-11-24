/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TagGroupEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: Category
// ====================================================

export interface Category_findTagCategory {
  __typename: "TagCategory";
  id: string;
  name: string;
  description: string | null;
  group: TagGroupEnum;
}

export interface Category {
  /**
   * Find a tag cateogry by ID
   */
  findTagCategory: Category_findTagCategory | null;
}

export interface CategoryVariables {
  id: string;
}
