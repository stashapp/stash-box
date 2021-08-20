/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { QuerySpec } from "./globalTypes";

// ====================================================
// GraphQL query operation: ImportScenes
// ====================================================

export interface ImportScenes_queryImportScenes_scenes {
  __typename: "SceneImportResult";
  title: string | null;
  date: string | null;
  description: string | null;
  image: string | null;
  url: string | null;
  duration: number | null;
  studio: string | null;
  performers: string[];
  tags: string[];
}

export interface ImportScenes_queryImportScenes {
  __typename: "QueryImportScenesResult";
  count: number;
  scenes: ImportScenes_queryImportScenes_scenes[];
}

export interface ImportScenes {
  /**
   * returns pending imported scene data for the current user
   */
  queryImportScenes: ImportScenes_queryImportScenes;
}

export interface ImportScenesVariables {
  querySpec?: QuerySpec | null;
}
