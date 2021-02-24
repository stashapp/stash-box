/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { StudioUpdateInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateStudio
// ====================================================

export interface UpdateStudio_studioUpdate_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface UpdateStudio_studioUpdate {
  __typename: "Studio";
  id: string;
  name: string;
  urls: (UpdateStudio_studioUpdate_urls | null)[];
}

export interface UpdateStudio {
  studioUpdate: UpdateStudio_studioUpdate | null;
}

export interface UpdateStudioVariables {
  input: StudioUpdateInput;
}
