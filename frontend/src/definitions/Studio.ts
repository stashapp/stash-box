/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Studio
// ====================================================

export interface Studio_findStudio_urls {
  url: string;
  type: string;
}

export interface Studio_findStudio_images {
  id: string;
  url: string;
  height: number | null;
  width: number | null;
}

export interface Studio_findStudio {
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
