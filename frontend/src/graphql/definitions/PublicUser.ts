/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: PublicUser
// ====================================================

export interface PublicUser_findUser {
  __typename: "User";
  id: string;
  name: string;
}

export interface PublicUser {
  /**
   * Find user by ID or username
   */
  findUser: PublicUser_findUser | null;
}

export interface PublicUserVariables {
  name: string;
}
