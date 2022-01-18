/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { QuerySpec, StudioFilterType } from "./globalTypes";

// ====================================================
// GraphQL query operation: Studios
// ====================================================

export interface Studios_queryStudios_studios_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Studios_queryStudios_studios_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface Studios_queryStudios_studios_urls {
  __typename: "URL";
  url: string;
  site: Studios_queryStudios_studios_urls_site;
}

export interface Studios_queryStudios_studios_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Studios_queryStudios_studios {
  __typename: "Studio";
  id: string;
  name: string;
  deleted: boolean;
  parent: Studios_queryStudios_studios_parent | null;
  urls: Studios_queryStudios_studios_urls[];
  images: Studios_queryStudios_studios_images[];
  is_favorite: boolean;
}

export interface Studios_queryStudios {
  __typename: "QueryStudiosResultType";
  count: number;
  studios: Studios_queryStudios_studios[];
}

export interface Studios {
  queryStudios: Studios_queryStudios;
}

export interface StudiosVariables {
  filter?: QuerySpec | null;
  studioFilter?: StudioFilterType | null;
}
