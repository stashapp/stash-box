/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CancelEditInput, TargetTypeEnum, OperationEnum, VoteStatusEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CancelEdit
// ====================================================

export interface CancelEdit_cancelEdit_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface CancelEdit_cancelEdit_target_Performer {
  __typename: "Performer" | "Scene" | "Studio";
}

export interface CancelEdit_cancelEdit_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export type CancelEdit_cancelEdit_target = CancelEdit_cancelEdit_target_Performer | CancelEdit_cancelEdit_target_Tag;

export interface CancelEdit_cancelEdit_details_PerformerEdit {
  __typename: "PerformerEdit" | "SceneEdit" | "StudioEdit";
}

export interface CancelEdit_cancelEdit_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
}

export type CancelEdit_cancelEdit_details = CancelEdit_cancelEdit_details_PerformerEdit | CancelEdit_cancelEdit_details_TagEdit;

export interface CancelEdit_cancelEdit_merge_sources_Performer {
  __typename: "Performer" | "Scene" | "Studio";
}

export interface CancelEdit_cancelEdit_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export type CancelEdit_cancelEdit_merge_sources = CancelEdit_cancelEdit_merge_sources_Performer | CancelEdit_cancelEdit_merge_sources_Tag;

export interface CancelEdit_cancelEdit {
  __typename: "Edit";
  id: string;
  target_type: TargetTypeEnum;
  operation: OperationEnum;
  status: VoteStatusEnum;
  applied: boolean;
  created: GQLTime;
  user: CancelEdit_cancelEdit_user | null;
  /**
   * Object being edited - null if creating a new object
   */
  target: CancelEdit_cancelEdit_target | null;
  details: CancelEdit_cancelEdit_details | null;
  /**
   * Objects to merge with the target. Only applicable to merges
   */
  merge_sources: CancelEdit_cancelEdit_merge_sources[];
}

export interface CancelEdit {
  /**
   * Cancel edit without voting
   */
  cancelEdit: CancelEdit_cancelEdit;
}

export interface CancelEditVariables {
  input: CancelEditInput;
}
