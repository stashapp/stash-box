/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { BulkImportInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AnalyzeDataMutation
// ====================================================

export interface AnalyzeDataMutation_analyzeData_results_studio_existingStudio {
  __typename: "Studio";
  name: string;
  id: string;
}

export interface AnalyzeDataMutation_analyzeData_results_studio {
  __typename: "StudioImportResult";
  name: string | null;
  existingStudio: AnalyzeDataMutation_analyzeData_results_studio_existingStudio | null;
}

export interface AnalyzeDataMutation_analyzeData_results_performers_existingPerformer {
  __typename: "Performer";
  name: string;
  id: string;
}

export interface AnalyzeDataMutation_analyzeData_results_performers {
  __typename: "PerformerImportResult";
  name: string | null;
  existingPerformer: AnalyzeDataMutation_analyzeData_results_performers_existingPerformer | null;
}

export interface AnalyzeDataMutation_analyzeData_results_tags_existingTag {
  __typename: "Tag";
  name: string;
  id: string;
}

export interface AnalyzeDataMutation_analyzeData_results_tags {
  __typename: "TagImportResult";
  name: string | null;
  existingTag: AnalyzeDataMutation_analyzeData_results_tags_existingTag | null;
}

export interface AnalyzeDataMutation_analyzeData_results {
  __typename: "SceneImportResult";
  title: string | null;
  date: string | null;
  description: string | null;
  image: string | null;
  url: string | null;
  duration: number | null;
  studio: AnalyzeDataMutation_analyzeData_results_studio | null;
  performers: AnalyzeDataMutation_analyzeData_results_performers[];
  tags: AnalyzeDataMutation_analyzeData_results_tags[];
}

export interface AnalyzeDataMutation_analyzeData {
  __typename: "BulkAnalyzeResult";
  errors: string[];
  results: AnalyzeDataMutation_analyzeData_results[];
}

export interface AnalyzeDataMutation {
  analyzeData: AnalyzeDataMutation_analyzeData;
}

export interface AnalyzeDataMutationVariables {
  input: BulkImportInput;
}
