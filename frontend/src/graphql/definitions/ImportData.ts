/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { BulkImportInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: ImportData
// ====================================================

export interface ImportData_importData {
  __typename: "BulkImportResult";
  errors: string[];
  scenesImported: number;
}

export interface ImportData {
  importData: ImportData_importData;
}

export interface ImportDataVariables {
  input: BulkImportInput;
}
