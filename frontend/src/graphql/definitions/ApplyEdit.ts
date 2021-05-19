/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ApplyEditInput, TargetTypeEnum, OperationEnum, VoteStatusEnum, GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: ApplyEdit
// ====================================================

export interface ApplyEdit_applyEdit_comments_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface ApplyEdit_applyEdit_comments {
  __typename: "EditComment";
  user: ApplyEdit_applyEdit_comments_user | null;
  date: any;
  comment: string;
}

export interface ApplyEdit_applyEdit_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface ApplyEdit_applyEdit_target_Scene {
  __typename: "Scene" | "Studio";
}

export interface ApplyEdit_applyEdit_target_Tag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface ApplyEdit_applyEdit_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: ApplyEdit_applyEdit_target_Tag_category | null;
}

export interface ApplyEdit_applyEdit_target_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface ApplyEdit_applyEdit_target_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface ApplyEdit_applyEdit_target_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEdit_applyEdit_target_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEdit_applyEdit_target_Performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface ApplyEdit_applyEdit_target_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface ApplyEdit_applyEdit_target_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: ApplyEdit_applyEdit_target_Performer_birthdate | null;
  age: number | null;
  /**
   * Height in cm
   */
  height: number | null;
  hair_color: HairColorEnum | null;
  eye_color: EyeColorEnum | null;
  ethnicity: EthnicityEnum | null;
  country: string | null;
  career_end_year: number | null;
  career_start_year: number | null;
  breast_type: BreastTypeEnum | null;
  measurements: ApplyEdit_applyEdit_target_Performer_measurements;
  tattoos: ApplyEdit_applyEdit_target_Performer_tattoos[] | null;
  piercings: ApplyEdit_applyEdit_target_Performer_piercings[] | null;
  urls: ApplyEdit_applyEdit_target_Performer_urls[];
  images: ApplyEdit_applyEdit_target_Performer_images[];
}

export type ApplyEdit_applyEdit_target = ApplyEdit_applyEdit_target_Scene | ApplyEdit_applyEdit_target_Tag | ApplyEdit_applyEdit_target_Performer;

export interface ApplyEdit_applyEdit_details_SceneEdit {
  __typename: "SceneEdit" | "StudioEdit";
}

export interface ApplyEdit_applyEdit_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  category_id: string | null;
}

export interface ApplyEdit_applyEdit_details_PerformerEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface ApplyEdit_applyEdit_details_PerformerEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface ApplyEdit_applyEdit_details_PerformerEdit_added_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEdit_applyEdit_details_PerformerEdit_removed_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEdit_applyEdit_details_PerformerEdit_added_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEdit_applyEdit_details_PerformerEdit_removed_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEdit_applyEdit_details_PerformerEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface ApplyEdit_applyEdit_details_PerformerEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface ApplyEdit_applyEdit_details_PerformerEdit {
  __typename: "PerformerEdit";
  name: string | null;
  disambiguation: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  gender: GenderEnum | null;
  added_urls: ApplyEdit_applyEdit_details_PerformerEdit_added_urls[] | null;
  removed_urls: ApplyEdit_applyEdit_details_PerformerEdit_removed_urls[] | null;
  birthdate: string | null;
  birthdate_accuracy: string | null;
  ethnicity: EthnicityEnum | null;
  country: string | null;
  eye_color: EyeColorEnum | null;
  hair_color: HairColorEnum | null;
  /**
   * Height in cm
   */
  height: number | null;
  cup_size: string | null;
  band_size: number | null;
  waist_size: number | null;
  hip_size: number | null;
  breast_type: BreastTypeEnum | null;
  career_start_year: number | null;
  career_end_year: number | null;
  added_tattoos: ApplyEdit_applyEdit_details_PerformerEdit_added_tattoos[] | null;
  removed_tattoos: ApplyEdit_applyEdit_details_PerformerEdit_removed_tattoos[] | null;
  added_piercings: ApplyEdit_applyEdit_details_PerformerEdit_added_piercings[] | null;
  removed_piercings: ApplyEdit_applyEdit_details_PerformerEdit_removed_piercings[] | null;
  added_images: (ApplyEdit_applyEdit_details_PerformerEdit_added_images | null)[] | null;
  removed_images: (ApplyEdit_applyEdit_details_PerformerEdit_removed_images | null)[] | null;
}

export type ApplyEdit_applyEdit_details = ApplyEdit_applyEdit_details_SceneEdit | ApplyEdit_applyEdit_details_TagEdit | ApplyEdit_applyEdit_details_PerformerEdit;

export interface ApplyEdit_applyEdit_old_details_SceneEdit {
  __typename: "SceneEdit" | "StudioEdit";
}

export interface ApplyEdit_applyEdit_old_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  category_id: string | null;
}

export interface ApplyEdit_applyEdit_old_details_PerformerEdit {
  __typename: "PerformerEdit";
  name: string | null;
  disambiguation: string | null;
  gender: GenderEnum | null;
  birthdate: string | null;
  birthdate_accuracy: string | null;
  ethnicity: EthnicityEnum | null;
  country: string | null;
  eye_color: EyeColorEnum | null;
  hair_color: HairColorEnum | null;
  /**
   * Height in cm
   */
  height: number | null;
  cup_size: string | null;
  band_size: number | null;
  waist_size: number | null;
  hip_size: number | null;
  breast_type: BreastTypeEnum | null;
  career_start_year: number | null;
  career_end_year: number | null;
}

export type ApplyEdit_applyEdit_old_details = ApplyEdit_applyEdit_old_details_SceneEdit | ApplyEdit_applyEdit_old_details_TagEdit | ApplyEdit_applyEdit_old_details_PerformerEdit;

export interface ApplyEdit_applyEdit_merge_sources_Scene {
  __typename: "Scene" | "Studio";
}

export interface ApplyEdit_applyEdit_merge_sources_Tag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface ApplyEdit_applyEdit_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: ApplyEdit_applyEdit_merge_sources_Tag_category | null;
}

export interface ApplyEdit_applyEdit_merge_sources_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface ApplyEdit_applyEdit_merge_sources_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface ApplyEdit_applyEdit_merge_sources_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEdit_applyEdit_merge_sources_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEdit_applyEdit_merge_sources_Performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface ApplyEdit_applyEdit_merge_sources_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface ApplyEdit_applyEdit_merge_sources_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: ApplyEdit_applyEdit_merge_sources_Performer_birthdate | null;
  age: number | null;
  /**
   * Height in cm
   */
  height: number | null;
  hair_color: HairColorEnum | null;
  eye_color: EyeColorEnum | null;
  ethnicity: EthnicityEnum | null;
  country: string | null;
  career_end_year: number | null;
  career_start_year: number | null;
  breast_type: BreastTypeEnum | null;
  measurements: ApplyEdit_applyEdit_merge_sources_Performer_measurements;
  tattoos: ApplyEdit_applyEdit_merge_sources_Performer_tattoos[] | null;
  piercings: ApplyEdit_applyEdit_merge_sources_Performer_piercings[] | null;
  urls: ApplyEdit_applyEdit_merge_sources_Performer_urls[];
  images: ApplyEdit_applyEdit_merge_sources_Performer_images[];
}

export type ApplyEdit_applyEdit_merge_sources = ApplyEdit_applyEdit_merge_sources_Scene | ApplyEdit_applyEdit_merge_sources_Tag | ApplyEdit_applyEdit_merge_sources_Performer;

export interface ApplyEdit_applyEdit_options {
  __typename: "PerformerEditOptions";
  /**
   *  Set performer alias on scenes without alias to old name if name is changed 
   */
  set_modify_aliases: boolean;
  /**
   *  Set performer alias on scenes attached to merge sources to old name 
   */
  set_merge_aliases: boolean;
}

export interface ApplyEdit_applyEdit {
  __typename: "Edit";
  id: string;
  target_type: TargetTypeEnum;
  operation: OperationEnum;
  status: VoteStatusEnum;
  applied: boolean;
  created: any;
  updated: any;
  comments: ApplyEdit_applyEdit_comments[];
  user: ApplyEdit_applyEdit_user | null;
  /**
   * Object being edited - null if creating a new object
   */
  target: ApplyEdit_applyEdit_target | null;
  details: ApplyEdit_applyEdit_details | null;
  /**
   * Previous state of fields being modified - null if operation is create or delete.
   */
  old_details: ApplyEdit_applyEdit_old_details | null;
  /**
   * Objects to merge with the target. Only applicable to merges
   */
  merge_sources: ApplyEdit_applyEdit_merge_sources[];
  /**
   * Entity specific options
   */
  options: ApplyEdit_applyEdit_options | null;
}

export interface ApplyEdit {
  /**
   * Apply edit without voting
   */
  applyEdit: ApplyEdit_applyEdit;
}

export interface ApplyEditVariables {
  input: ApplyEditInput;
}
