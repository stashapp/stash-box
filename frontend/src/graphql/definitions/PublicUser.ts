/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: PublicUser
// ====================================================

export interface PublicUser_findUser_vote_count {
  __typename: "UserVoteCount";
  accept: number;
  reject: number;
  immediate_accept: number;
  immediate_reject: number;
  abstain: number;
}

export interface PublicUser_findUser_edit_count {
  __typename: "UserEditCount";
  immediate_accepted: number;
  immediate_rejected: number;
  accepted: number;
  rejected: number;
  failed: number;
  canceled: number;
  pending: number;
}

export interface PublicUser_findUser {
  __typename: "User";
  id: string;
  name: string;
  /**
   *  Vote counts by type 
   */
  vote_count: PublicUser_findUser_vote_count;
  /**
   *  Edit counts by status 
   */
  edit_count: PublicUser_findUser_edit_count;
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
