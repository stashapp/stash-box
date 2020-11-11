/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ResetPasswordInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: ResetPasswordMutation
// ====================================================

export interface ResetPasswordMutation {
  /**
   * Generates an email to reset a user password
   */
  resetPassword: boolean;
}

export interface ResetPasswordMutationVariables {
  input: ResetPasswordInput;
}
