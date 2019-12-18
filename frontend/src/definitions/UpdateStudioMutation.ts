/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { StudioUpdateInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateStudioMutation
// ====================================================

export interface UpdateStudioMutation_studioUpdate_urls {
  url: string;
  type: string;
}

export interface UpdateStudioMutation_studioUpdate {
  id: string;
  name: string;
  urls: (UpdateStudioMutation_studioUpdate_urls | null)[];
}

export interface UpdateStudioMutation {
  studioUpdate: UpdateStudioMutation_studioUpdate | null;
}

export interface UpdateStudioMutationVariables {
  input: StudioUpdateInput;
}
