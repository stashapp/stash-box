/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CompleteSceneImportInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CompleteSceneImport
// ====================================================

export interface CompleteSceneImport {
  /**
   * finalises a pending scene import, creating the scenes
   */
  completeSceneImport: boolean;
}

export interface CompleteSceneImportVariables {
  input: CompleteSceneImportInput;
}
