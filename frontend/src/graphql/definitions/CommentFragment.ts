/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CommentFragment
// ====================================================

export interface CommentFragment_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface CommentFragment {
  __typename: "EditComment";
  user: CommentFragment_user | null;
  date: any;
  comment: string;
}
