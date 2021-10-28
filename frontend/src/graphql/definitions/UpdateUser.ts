/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UserUpdateInput, RoleEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateUser
// ====================================================

export interface UpdateUser_userUpdate {
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
  roles: RoleEnum[];
}

export interface UpdateUser {
  userUpdate: UpdateUser_userUpdate | null;
}

export interface UpdateUserVariables {
  userData: UserUpdateInput;
}
