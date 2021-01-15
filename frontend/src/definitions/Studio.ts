/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Studio
// ====================================================

export interface Studio_findStudio_urls {
  __typename: "URL";
  url: string;
  type: string;
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
  urls: (Studio_findStudio_urls | null)[];
  images: Studio_findStudio_images[];
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
