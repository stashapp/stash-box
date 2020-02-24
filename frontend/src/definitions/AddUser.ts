/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UserCreateInput, RoleEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddUser
// ====================================================

export interface AddUser_userCreate {
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

export interface AddUser {
  userCreate: AddUser_userCreate | null;
}

export interface AddUserVariables {
  userData: UserCreateInput;
}
