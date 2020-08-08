/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import {
  TagEditInput,
  TargetTypeEnum,
  OperationEnum,
  VoteStatusEnum,
} from "./globalTypes";

// ====================================================
// GraphQL mutation operation: TagEditMutation
// ====================================================

export interface TagEditMutation_tagEdit_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface TagEditMutation_tagEdit_target_Performer {
  __typename: "Performer" | "Scene" | "Studio";
}

export interface TagEditMutation_tagEdit_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export type TagEditMutation_tagEdit_target =
  | TagEditMutation_tagEdit_target_Performer
  | TagEditMutation_tagEdit_target_Tag;

export interface TagEditMutation_tagEdit_details_PerformerEdit {
  __typename: "PerformerEdit" | "SceneEdit" | "StudioEdit";
}

export interface TagEditMutation_tagEdit_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
}

export type TagEditMutation_tagEdit_details =
  | TagEditMutation_tagEdit_details_PerformerEdit
  | TagEditMutation_tagEdit_details_TagEdit;

export interface TagEditMutation_tagEdit_merge_sources_Performer {
  __typename: "Performer" | "Scene" | "Studio";
}

export interface TagEditMutation_tagEdit_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export type TagEditMutation_tagEdit_merge_sources =
  | TagEditMutation_tagEdit_merge_sources_Performer
  | TagEditMutation_tagEdit_merge_sources_Tag;

export interface TagEditMutation_tagEdit {
  __typename: "Edit";
  id: string;
  target_type: TargetTypeEnum;
  operation: OperationEnum;
  status: VoteStatusEnum;
  applied: boolean;
  created: any;
  user: TagEditMutation_tagEdit_user;
  /**
   * Object being edited - null if creating a new object
   */
  target: TagEditMutation_tagEdit_target | null;
  details: TagEditMutation_tagEdit_details | null;
  /**
   * Objects to merge with the target. Only applicable to merges
   */
  merge_sources: (TagEditMutation_tagEdit_merge_sources | null)[];
}

export interface TagEditMutation {
  /**
   * Propose a new tag or modification to a tag
   */
  tagEdit: TagEditMutation_tagEdit;
}

export interface TagEditMutationVariables {
  tagData: TagEditInput;
}
