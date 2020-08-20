/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UserChangePasswordInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: ChangePasswordMutation
// ====================================================

export interface ChangePasswordMutation {
  /**
   * Changes the password for the current user
   */
  changePassword: boolean;
}

export interface ChangePasswordMutationVariables {
  userData: UserChangePasswordInput;
}
