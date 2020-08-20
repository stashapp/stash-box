/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UserCreateInput, RoleEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddUserMutation
// ====================================================

export interface AddUserMutation_userCreate {
  __typename: "User";
  id: string;
  name: string;
  /**
   * Should not be visible to other users
   */
  email: string | null;
  /**
   * Should not be visible to other users
   */
  roles: RoleEnum[] | null;
}

export interface AddUserMutation {
  userCreate: AddUserMutation_userCreate | null;
}

export interface AddUserMutationVariables {
  userData: UserCreateInput;
}
