/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { StudioCreateInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddStudioMutation
// ====================================================

export interface AddStudioMutation_studioCreate_urls {
  url: string;
  type: string;
}

export interface AddStudioMutation_studioCreate {
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
