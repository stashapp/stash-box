/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.


import { StudioUpdateInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateStudio
// ====================================================


export interface UpdateStudio_studioUpdate_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface UpdateStudio_studioUpdate_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface UpdateStudio_studioUpdate_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface UpdateStudio_studioUpdate_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface UpdateStudio_studioUpdate {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: UpdateStudio_studioUpdate_child_studios[];
  parent: UpdateStudio_studioUpdate_parent | null;
  urls: UpdateStudio_studioUpdate_urls[];
  images: UpdateStudio_studioUpdate_images[];
  deleted: boolean;
}

export interface UpdateStudio {
  studioUpdate: UpdateStudio_studioUpdate | null;
}

export interface UpdateStudioVariables {
  input: StudioUpdateInput;
}
