/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UserUpdateInput, RoleEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateUserMutation
// ====================================================

export interface UpdateUserMutation_userUpdate {
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

export interface UpdateUserMutation {
  userUpdate: UpdateUserMutation_userUpdate | null;
}

export interface UpdateUserMutationVariables {
  userData: UserUpdateInput;
}
