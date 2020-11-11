/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ActivateNewUserInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: ActivateNewUserMutation
// ====================================================

export interface ActivateNewUserMutation_activateNewUser {
  __typename: "User";
  id: string;
}

export interface ActivateNewUserMutation {
  activateNewUser: ActivateNewUserMutation_activateNewUser | null;
}

export interface ActivateNewUserMutationVariables {
  input: ActivateNewUserInput;
}
