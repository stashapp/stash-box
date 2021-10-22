/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { RoleEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: User
// ====================================================

export interface User_findUser_invited_by {
  __typename: "User";
  id: string;
  name: string;
}

export interface User_findUser {
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
  /**
   * Should not be visible to other users
   */
  api_key: string | null;
  /**
   * Calls to the API from this user over a configurable time period
   */
  api_calls: number;
  invited_by: User_findUser_invited_by | null;
  invite_tokens: number | null;
  active_invite_codes: string[] | null;
}

export interface User {
  /**
   * Find user by ID or username
   */
  findUser: User_findUser | null;
}

export interface UserVariables {
  name: string;
}
