/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: RegenerateAPIKey
// ====================================================

export interface RegenerateAPIKey {
  /**
   * Regenerates the api key for the given user, or the current user if id not provided
   */
  regenerateAPIKey: string;
}

export interface RegenerateAPIKeyVariables {
  user_id?: string | null;
}
