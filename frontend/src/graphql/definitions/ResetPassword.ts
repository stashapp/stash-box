/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ResetPasswordInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: ResetPassword
// ====================================================

export interface ResetPassword {
  /**
   * Generates an email to reset a user password
   */
  resetPassword: boolean;
}

export interface ResetPasswordVariables {
  input: ResetPasswordInput;
}
