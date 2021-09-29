/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Studio
// ====================================================

export interface Studio_findStudio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Studio_findStudio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Studio_findStudio_urls_site {
  __typename: "Site";
  id: string;
  name: string;
}

export interface Studio_findStudio_urls {
  __typename: "URL";
  url: string;
  site: Studio_findStudio_urls_site;
}

export interface Studio_findStudio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface Studio_findStudio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: Studio_findStudio_child_studios[];
  parent: Studio_findStudio_parent | null;
  urls: Studio_findStudio_urls[];
  images: Studio_findStudio_images[];
  deleted: boolean;
}

export interface Studio {
  /**
   * Find a studio by ID or name
   */
  findStudio: Studio_findStudio | null;
}

export interface StudioVariables {
  id: string;
}
