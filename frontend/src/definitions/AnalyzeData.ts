/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { BulkImportInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AnalyzeData
// ====================================================

export interface AnalyzeData_analyzeData_results_studio {
  __typename: "StudioImportResult";
  name: string | null;
}

export interface AnalyzeData_analyzeData_results_performers {
  __typename: "PerformerImportResult";
  name: string | null;
}

export interface AnalyzeData_analyzeData_results_tags {
  __typename: "TagImportResult";
  name: string | null;
}

export interface AnalyzeData_analyzeData_results {
  __typename: "SceneImportResult";
  title: string | null;
  date: string | null;
  image: string | null;
  url: string | null;
  duration: number | null;
  studio: AnalyzeData_analyzeData_results_studio | null;
  performers: AnalyzeData_analyzeData_results_performers[];
  tags: AnalyzeData_analyzeData_results_tags[];
}

export interface AnalyzeData_analyzeData {
  __typename: "BulkAnalyzeResult";
  errors: string[];
  results: AnalyzeData_analyzeData_results[];
}

export interface AnalyzeData {
  analyzeData: AnalyzeData_analyzeData;
}

export interface AnalyzeDataVariables {
  input: BulkImportInput;
}
