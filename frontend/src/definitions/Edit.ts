/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TargetTypeEnum, OperationEnum, VoteStatusEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: Edit
// ====================================================

export interface Edit_findEdit_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface Edit_findEdit_target_Performer {
  __typename: "Performer" | "Scene" | "Studio";
}

export interface Edit_findEdit_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export type Edit_findEdit_target = Edit_findEdit_target_Performer | Edit_findEdit_target_Tag;

export interface Edit_findEdit_details_PerformerEdit {
  __typename: "PerformerEdit" | "SceneEdit" | "StudioEdit";
}

export interface Edit_findEdit_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
}

export type Edit_findEdit_details = Edit_findEdit_details_PerformerEdit | Edit_findEdit_details_TagEdit;

export interface Edit_findEdit_merge_sources_Performer {
  __typename: "Performer" | "Scene" | "Studio";
}

export interface Edit_findEdit_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export type Edit_findEdit_merge_sources = Edit_findEdit_merge_sources_Performer | Edit_findEdit_merge_sources_Tag;

export interface Edit_findEdit {
  __typename: "Edit";
  id: string;
  target_type: TargetTypeEnum;
  operation: OperationEnum;
  status: VoteStatusEnum;
  applied: boolean;
  created: any;
  user: Edit_findEdit_user;
  /**
   * Object being edited - null if creating a new object
   */
  target: Edit_findEdit_target | null;
  details: Edit_findEdit_details | null;
  /**
   * Objects to merge with the target. Only applicable to merges
   */
  merge_sources: (Edit_findEdit_merge_sources | null)[];
}

export interface Edit {
  findEdit: Edit_findEdit | null;
}

export interface EditVariables {
  id?: string | null;
}
