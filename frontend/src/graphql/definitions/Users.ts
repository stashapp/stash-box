/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.


import { UserFilterType, QuerySpec, RoleEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: Users
// ====================================================


export interface Users_queryUsers_users_invited_by {
  __typename: "User";
  id: string;
  name: string;
}

export interface Users_queryUsers_users {
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
  /**
   * Should not be visible to other users
   */
  api_key: string | null;
  /**
   * Calls to the API from this user over a configurable time period
   */
  api_calls: number;
  invited_by: Users_queryUsers_users_invited_by | null;
  invite_tokens: number | null;
}

export interface Users_queryUsers {
  __typename: "QueryUsersResultType";
  count: number;
  users: Users_queryUsers_users[];
}

export interface Users {
  queryUsers: Users_queryUsers;
}

export interface UsersVariables {
  userFilter?: UserFilterType | null;
  filter?: QuerySpec | null;
}
