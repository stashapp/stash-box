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

export interface User_findUser_vote_count {
  __typename: "UserVoteCount";
  accept: number;
  reject: number;
  immediate_accept: number;
  immediate_reject: number;
  abstain: number;
}

export interface User_findUser_edit_count {
  __typename: "UserEditCount";
  immediate_accepted: number;
  immediate_rejected: number;
  accepted: number;
  rejected: number;
  failed: number;
  canceled: number;
  pending: number;
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
  roles: RoleEnum[] | null;
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
  /**
   *  Vote counts by type 
   */
  vote_count: User_findUser_vote_count;
  /**
   *  Edit counts by status 
   */
  edit_count: User_findUser_edit_count;
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
