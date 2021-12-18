/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { StudioCreateInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddStudio
// ====================================================

export interface AddStudio_studioCreate_urls_site {
  __typename: "Site";
  id: string;
  name: string;
}

export interface AddStudio_studioCreate_urls {
  __typename: "URL";
  url: string;
  site: AddStudio_studioCreate_urls_site;
}

export interface AddStudio_studioCreate {
  __typename: "Studio";
  id: string;
  name: string;
  urls: AddStudio_studioCreate_urls[];
}

export interface AddStudio {
  studioCreate: AddStudio_studioCreate | null;
}

export interface AddStudioVariables {
  studioData: StudioCreateInput;
}
