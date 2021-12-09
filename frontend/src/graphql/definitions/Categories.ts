/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { QuerySpec, TagGroupEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: Categories
// ====================================================

export interface Categories_queryTagCategories_tag_categories {
  __typename: "TagCategory";
  id: string;
  name: string;
  description: string | null;
  group: TagGroupEnum;
}

export interface Categories_queryTagCategories {
  __typename: "QueryTagCategoriesResultType";
  count: number;
  tag_categories: Categories_queryTagCategories_tag_categories[];
}

export interface Categories {
  queryTagCategories: Categories_queryTagCategories;
}

export interface CategoriesVariables {
  filter?: QuerySpec | null;
}
