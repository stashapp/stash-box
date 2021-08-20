/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ImportSceneMappings
// ====================================================

export interface ImportSceneMappings_queryImportSceneMappings_studios_existingStudio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface ImportSceneMappings_queryImportSceneMappings_studios {
  __typename: "StudioImportMapping";
  name: string;
  existingStudio: ImportSceneMappings_queryImportSceneMappings_studios_existingStudio | null;
}

export interface ImportSceneMappings_queryImportSceneMappings_performers_existingPerformer {
  __typename: "Performer";
  id: string;
  name: string;
}

export interface ImportSceneMappings_queryImportSceneMappings_performers {
  __typename: "PerformerImportMapping";
  name: string;
  existingPerformer: ImportSceneMappings_queryImportSceneMappings_performers_existingPerformer | null;
}

export interface ImportSceneMappings_queryImportSceneMappings_tags_existingTag {
  __typename: "Tag";
  id: string;
  name: string;
}

export interface ImportSceneMappings_queryImportSceneMappings_tags {
  __typename: "TagImportMapping";
  name: string;
  existingTag: ImportSceneMappings_queryImportSceneMappings_tags_existingTag | null;
}

export interface ImportSceneMappings_queryImportSceneMappings {
  __typename: "SceneImportMappings";
  studios: ImportSceneMappings_queryImportSceneMappings_studios[];
  performers: ImportSceneMappings_queryImportSceneMappings_performers[];
  tags: ImportSceneMappings_queryImportSceneMappings_tags[];
}

export interface ImportSceneMappings {
  /**
   * returns the current mappings of name to performer/tag/studio from the current pending import
   */
  queryImportSceneMappings: ImportSceneMappings_queryImportSceneMappings;
}
