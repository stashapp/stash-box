/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ActivateNewUserInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: ActivateNewUser
// ====================================================

export interface ActivateNewUser_activateNewUser {
  __typename: "User";
  id: string;
}

export interface ActivateNewUser {
  activateNewUser: ActivateNewUser_activateNewUser | null;
}

export interface ActivateNewUserVariables {
  input: ActivateNewUserInput;
}
