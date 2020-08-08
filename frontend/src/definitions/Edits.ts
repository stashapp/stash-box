/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { QuerySpec, EditFilterType, TargetTypeEnum, OperationEnum, VoteStatusEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: Edits
// ====================================================

export interface Edits_queryEdits_edits_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_target_Performer {
  __typename: "Performer" | "Scene" | "Studio";
}

export interface Edits_queryEdits_edits_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export type Edits_queryEdits_edits_target = Edits_queryEdits_edits_target_Performer | Edits_queryEdits_edits_target_Tag;

export interface Edits_queryEdits_edits_details_PerformerEdit {
  __typename: "PerformerEdit" | "SceneEdit" | "StudioEdit";
}

export interface Edits_queryEdits_edits_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
}

export type Edits_queryEdits_edits_details = Edits_queryEdits_edits_details_PerformerEdit | Edits_queryEdits_edits_details_TagEdit;

export interface Edits_queryEdits_edits_merge_sources_Performer {
  __typename: "Performer" | "Scene" | "Studio";
}

export interface Edits_queryEdits_edits_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export type Edits_queryEdits_edits_merge_sources = Edits_queryEdits_edits_merge_sources_Performer | Edits_queryEdits_edits_merge_sources_Tag;

export interface Edits_queryEdits_edits {
  __typename: "Edit";
  id: string;
  target_type: TargetTypeEnum;
  operation: OperationEnum;
  status: VoteStatusEnum;
  applied: boolean;
  created: any;
  user: Edits_queryEdits_edits_user;
  /**
   * Object being edited - null if creating a new object
   */
  target: Edits_queryEdits_edits_target | null;
  details: Edits_queryEdits_edits_details | null;
  /**
   * Objects to merge with the target. Only applicable to merges
   */
  merge_sources: (Edits_queryEdits_edits_merge_sources | null)[];
}

export interface Edits_queryEdits {
  __typename: "QueryEditsResultType";
  count: number;
  edits: Edits_queryEdits_edits[];
}

export interface Edits {
  queryEdits: Edits_queryEdits;
}

export interface EditsVariables {
  filter?: QuerySpec | null;
  editFilter?: EditFilterType | null;
}
