/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TagCreateInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddTagMutation
// ====================================================

export interface AddTagMutation_tagCreate {
  __typename: "Tag";
  name: string;
  description: string | null;
}

export interface AddTagMutation {
  tagCreate: AddTagMutation_tagCreate | null;
}

export interface AddTagMutationVariables {
  tagData: TagCreateInput;
}
