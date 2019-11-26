/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { UpdateStudio } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateStudioMutation
// ====================================================

export interface UpdateStudioMutation_updateStudio {
  id: number;
  uuid: any;
  title: string;
  url: string | null;
  photoUrl: string | null;
}

export interface UpdateStudioMutation {
  updateStudio: UpdateStudioMutation_updateStudio;
}

export interface UpdateStudioMutationVariables {
  studioId: number;
  studioData: UpdateStudio;
}
