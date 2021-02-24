/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UserChangePasswordInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: ChangePassword
// ====================================================

export interface ChangePassword {
  /**
   * Changes the password for the current user
   */
  changePassword: boolean;
}

export interface ChangePasswordVariables {
  userData: UserChangePasswordInput;
}
