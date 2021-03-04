/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { EditCommentInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: EditComment
// ====================================================

export interface EditComment_editComment_comments_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface EditComment_editComment_comments {
  __typename: "EditComment";
  user: EditComment_editComment_comments_user;
  date: any;
  comment: string;
}

export interface EditComment_editComment {
  __typename: "Edit";
  id: string;
  comments: EditComment_editComment_comments[];
}

export interface EditComment {
  /**
   * Comment on an edit
   */
  editComment: EditComment_editComment;
}

export interface EditCommentVariables {
  input: EditCommentInput;
}
