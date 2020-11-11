/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CancelEditInput, TargetTypeEnum, OperationEnum, VoteStatusEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CancelEditMutation
// ====================================================

export interface CancelEditMutation_cancelEdit_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface CancelEditMutation_cancelEdit_target_Performer {
  __typename: "Performer" | "Scene" | "Studio";
}

export interface CancelEditMutation_cancelEdit_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export type CancelEditMutation_cancelEdit_target = CancelEditMutation_cancelEdit_target_Performer | CancelEditMutation_cancelEdit_target_Tag;

export interface CancelEditMutation_cancelEdit_details_PerformerEdit {
  __typename: "PerformerEdit" | "SceneEdit" | "StudioEdit";
}

export interface CancelEditMutation_cancelEdit_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
}

export type CancelEditMutation_cancelEdit_details = CancelEditMutation_cancelEdit_details_PerformerEdit | CancelEditMutation_cancelEdit_details_TagEdit;

export interface CancelEditMutation_cancelEdit_merge_sources_Performer {
  __typename: "Performer" | "Scene" | "Studio";
}

export interface CancelEditMutation_cancelEdit_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export type CancelEditMutation_cancelEdit_merge_sources = CancelEditMutation_cancelEdit_merge_sources_Performer | CancelEditMutation_cancelEdit_merge_sources_Tag;

export interface CancelEditMutation_cancelEdit {
  __typename: "Edit";
  id: string;
  target_type: TargetTypeEnum;
  operation: OperationEnum;
  status: VoteStatusEnum;
  applied: boolean;
  created: any;
  user: CancelEditMutation_cancelEdit_user;
  /**
   * Object being edited - null if creating a new object
   */
  target: CancelEditMutation_cancelEdit_target | null;
  details: CancelEditMutation_cancelEdit_details | null;
  /**
   * Objects to merge with the target. Only applicable to merges
   */
  merge_sources: CancelEditMutation_cancelEdit_merge_sources[];
}

export interface CancelEditMutation {
  /**
   * Cancel edit without voting
   */
  cancelEdit: CancelEditMutation_cancelEdit;
}

export interface CancelEditMutationVariables {
  input: CancelEditInput;
}
