/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { MassageImportDataInput, QuerySpec } from "./globalTypes";

// ====================================================
// GraphQL query operation: ParseImportData
// ====================================================

export interface ParseImportData_parseImportData_data {
  __typename: "ParseImportDataTuple";
  field: string;
  value: string[];
}

export interface ParseImportData_parseImportData {
  __typename: "ParseImportDataResult";
  count: number;
  data: ParseImportData_parseImportData_data[][];
}

export interface ParseImportData {
  /**
   * Returns the result of parsing import data
   */
  parseImportData: ParseImportData_parseImportData;
}

export interface ParseImportDataVariables {
  input: MassageImportDataInput;
  filter?: QuerySpec | null;
}
