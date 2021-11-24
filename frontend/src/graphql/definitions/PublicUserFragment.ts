/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.


// ====================================================
// GraphQL fragment: PublicUserFragment
// ====================================================


export interface PublicUserFragment_vote_count {
  __typename: "UserVoteCount";
  accept: number;
  reject: number;
  immediate_accept: number;
  immediate_reject: number;
  abstain: number;
}

export interface PublicUserFragment_edit_count {
  __typename: "UserEditCount";
  immediate_accepted: number;
  immediate_rejected: number;
  accepted: number;
  rejected: number;
  failed: number;
  canceled: number;
  pending: number;
}

export interface PublicUserFragment {
  __typename: "User";
  id: string;
  name: string;
  /**
   *  Vote counts by type 
   */
  vote_count: PublicUserFragment_vote_count;
  /**
   *  Edit counts by status 
   */
  edit_count: PublicUserFragment_edit_count;
}
