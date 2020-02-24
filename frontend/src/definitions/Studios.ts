/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { QuerySpec, StudioFilterType } from "./globalTypes";

// ====================================================
// GraphQL query operation: Studios
// ====================================================

export interface Studios_queryStudios_studios_urls {
  url: string;
  type: string;
}

export interface Studios_queryStudios_studios {
  id: string;
  name: string;
  urls: (Studios_queryStudios_studios_urls | null)[];
}

export interface Studios_queryStudios {
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
