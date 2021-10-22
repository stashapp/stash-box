/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { RoleEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: Me
// ====================================================

export interface Me_me {
  __typename: "User";
  id: string;
  name: string;
  /**
   * Should not be visible to other users
   */
  roles: RoleEnum[];
}

export interface Me {
  /**
   * Returns currently authenticated user
   */
  me: Me_me | null;
}
