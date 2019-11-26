/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { UpdateStudio } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddStudioMutation
// ====================================================

export interface AddStudioMutation_addStudio {
  id: number;
  uuid: any;
  title: string;
  url: string | null;
  photoUrl: string | null;
}

export interface AddStudioMutation {
  addStudio: AddStudioMutation_addStudio;
}

export interface AddStudioMutationVariables {
  studioData: UpdateStudio;
}
