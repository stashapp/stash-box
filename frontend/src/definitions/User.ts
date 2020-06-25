/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { RoleEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: User
// ====================================================

export interface User_findUser {
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
