/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TargetTypeEnum, OperationEnum, VoteStatusEnum } from "./globalTypes";

// ====================================================
// GraphQL fragment: EditFragment
// ====================================================

export interface EditFragment_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface EditFragment_target_Performer {
  __typename: "Performer" | "Scene" | "Studio";
}

export interface EditFragment_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export type EditFragment_target = EditFragment_target_Performer | EditFragment_target_Tag;

export interface EditFragment_details_PerformerEdit {
  __typename: "PerformerEdit" | "SceneEdit" | "StudioEdit";
}

export interface EditFragment_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
}

export type EditFragment_details = EditFragment_details_PerformerEdit | EditFragment_details_TagEdit;

export interface EditFragment_merge_sources_Performer {
  __typename: "Performer" | "Scene" | "Studio";
}

export interface EditFragment_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export type EditFragment_merge_sources = EditFragment_merge_sources_Performer | EditFragment_merge_sources_Tag;

export interface EditFragment {
  __typename: "Edit";
  id: string;
  target_type: TargetTypeEnum;
  operation: OperationEnum;
  status: VoteStatusEnum;
  applied: boolean;
  created: any;
  user: EditFragment_user;
  /**
   * Object being edited - null if creating a new object
   */
  target: EditFragment_target | null;
  details: EditFragment_details | null;
  /**
   * Objects to merge with the target. Only applicable to merges
   */
  merge_sources: (EditFragment_merge_sources | null)[];
}
