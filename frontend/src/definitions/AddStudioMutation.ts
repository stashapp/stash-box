/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { StudioCreateInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddStudioMutation
// ====================================================

export interface AddStudioMutation_studioCreate_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface AddStudioMutation_studioCreate {
  __typename: "Studio";
  id: string;
  name: string;
  urls: (AddStudioMutation_studioCreate_urls | null)[];
}

export interface AddStudioMutation {
  studioCreate: AddStudioMutation_studioCreate | null;
}

export interface AddStudioMutationVariables {
  studioData: StudioCreateInput;
}
