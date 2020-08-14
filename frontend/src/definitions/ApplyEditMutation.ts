/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import {
  ApplyEditInput,
  TargetTypeEnum,
  OperationEnum,
  VoteStatusEnum,
} from "./globalTypes";

// ====================================================
// GraphQL mutation operation: ApplyEditMutation
// ====================================================

export interface ApplyEditMutation_applyEdit_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface ApplyEditMutation_applyEdit_target_Performer {
  __typename: "Performer" | "Scene" | "Studio";
}

export interface ApplyEditMutation_applyEdit_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export type ApplyEditMutation_applyEdit_target =
  | ApplyEditMutation_applyEdit_target_Performer
  | ApplyEditMutation_applyEdit_target_Tag;

export interface ApplyEditMutation_applyEdit_details_PerformerEdit {
  __typename: "PerformerEdit" | "SceneEdit" | "StudioEdit";
}

export interface ApplyEditMutation_applyEdit_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
}

export type ApplyEditMutation_applyEdit_details =
  | ApplyEditMutation_applyEdit_details_PerformerEdit
  | ApplyEditMutation_applyEdit_details_TagEdit;

export interface ApplyEditMutation_applyEdit_merge_sources_Performer {
  __typename: "Performer" | "Scene" | "Studio";
}

export interface ApplyEditMutation_applyEdit_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export type ApplyEditMutation_applyEdit_merge_sources =
  | ApplyEditMutation_applyEdit_merge_sources_Performer
  | ApplyEditMutation_applyEdit_merge_sources_Tag;

export interface ApplyEditMutation_applyEdit {
  __typename: "Edit";
  id: string;
  target_type: TargetTypeEnum;
  operation: OperationEnum;
  status: VoteStatusEnum;
  applied: boolean;
  created: any;
  user: ApplyEditMutation_applyEdit_user;
  /**
   * Object being edited - null if creating a new object
   */
  target: ApplyEditMutation_applyEdit_target | null;
  details: ApplyEditMutation_applyEdit_details | null;
  /**
   * Objects to merge with the target. Only applicable to merges
   */
  merge_sources: ApplyEditMutation_applyEdit_merge_sources[];
}

export interface ApplyEditMutation {
  /**
   * Apply edit without voting
   */
  applyEdit: ApplyEditMutation_applyEdit;
}

export interface ApplyEditMutationVariables {
  input: ApplyEditInput;
}
