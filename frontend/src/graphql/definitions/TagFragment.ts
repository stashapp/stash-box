/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.


// ====================================================
// GraphQL fragment: TagFragment
// ====================================================


export interface TagFragment_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface TagFragment {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: TagFragment_category | null;
}
