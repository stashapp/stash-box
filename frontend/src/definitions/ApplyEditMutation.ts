/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ApplyEditInput, TargetTypeEnum, OperationEnum, VoteStatusEnum, GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: ApplyEditMutation
// ====================================================

export interface ApplyEditMutation_applyEdit_comments_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface ApplyEditMutation_applyEdit_comments {
  __typename: "EditComment";
  user: ApplyEditMutation_applyEdit_comments_user;
  date: any;
  comment: string;
}

export interface ApplyEditMutation_applyEdit_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface ApplyEditMutation_applyEdit_target_Scene {
  __typename: "Scene" | "Studio";
}

export interface ApplyEditMutation_applyEdit_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export interface ApplyEditMutation_applyEdit_target_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface ApplyEditMutation_applyEdit_target_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface ApplyEditMutation_applyEdit_target_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEditMutation_applyEdit_target_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEditMutation_applyEdit_target_Performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface ApplyEditMutation_applyEdit_target_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number | null;
  height: number | null;
}

export interface ApplyEditMutation_applyEdit_target_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: ApplyEditMutation_applyEdit_target_Performer_birthdate | null;
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
  measurements: ApplyEditMutation_applyEdit_target_Performer_measurements;
  tattoos: ApplyEditMutation_applyEdit_target_Performer_tattoos[] | null;
  piercings: ApplyEditMutation_applyEdit_target_Performer_piercings[] | null;
  urls: ApplyEditMutation_applyEdit_target_Performer_urls[];
  images: ApplyEditMutation_applyEdit_target_Performer_images[];
}

export type ApplyEditMutation_applyEdit_target = ApplyEditMutation_applyEdit_target_Scene | ApplyEditMutation_applyEdit_target_Tag | ApplyEditMutation_applyEdit_target_Performer;

export interface ApplyEditMutation_applyEdit_details_SceneEdit {
  __typename: "SceneEdit" | "StudioEdit";
}

export interface ApplyEditMutation_applyEdit_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
}

export interface ApplyEditMutation_applyEdit_details_PerformerEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface ApplyEditMutation_applyEdit_details_PerformerEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface ApplyEditMutation_applyEdit_details_PerformerEdit_added_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEditMutation_applyEdit_details_PerformerEdit_removed_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEditMutation_applyEdit_details_PerformerEdit_added_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEditMutation_applyEdit_details_PerformerEdit_removed_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEditMutation_applyEdit_details_PerformerEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number | null;
  height: number | null;
}

export interface ApplyEditMutation_applyEdit_details_PerformerEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number | null;
  height: number | null;
}

export interface ApplyEditMutation_applyEdit_details_PerformerEdit {
  __typename: "PerformerEdit";
  name: string | null;
  disambiguation: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  gender: GenderEnum | null;
  added_urls: ApplyEditMutation_applyEdit_details_PerformerEdit_added_urls[] | null;
  removed_urls: ApplyEditMutation_applyEdit_details_PerformerEdit_removed_urls[] | null;
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
  added_tattoos: ApplyEditMutation_applyEdit_details_PerformerEdit_added_tattoos[] | null;
  removed_tattoos: ApplyEditMutation_applyEdit_details_PerformerEdit_removed_tattoos[] | null;
  added_piercings: ApplyEditMutation_applyEdit_details_PerformerEdit_added_piercings[] | null;
  removed_piercings: ApplyEditMutation_applyEdit_details_PerformerEdit_removed_piercings[] | null;
  added_images: ApplyEditMutation_applyEdit_details_PerformerEdit_added_images[] | null;
  removed_images: ApplyEditMutation_applyEdit_details_PerformerEdit_removed_images[] | null;
}

export type ApplyEditMutation_applyEdit_details = ApplyEditMutation_applyEdit_details_SceneEdit | ApplyEditMutation_applyEdit_details_TagEdit | ApplyEditMutation_applyEdit_details_PerformerEdit;

export interface ApplyEditMutation_applyEdit_old_details_SceneEdit {
  __typename: "SceneEdit" | "StudioEdit";
}

export interface ApplyEditMutation_applyEdit_old_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
}

export interface ApplyEditMutation_applyEdit_old_details_PerformerEdit {
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

export type ApplyEditMutation_applyEdit_old_details = ApplyEditMutation_applyEdit_old_details_SceneEdit | ApplyEditMutation_applyEdit_old_details_TagEdit | ApplyEditMutation_applyEdit_old_details_PerformerEdit;

export interface ApplyEditMutation_applyEdit_merge_sources_Scene {
  __typename: "Scene" | "Studio";
}

export interface ApplyEditMutation_applyEdit_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export interface ApplyEditMutation_applyEdit_merge_sources_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface ApplyEditMutation_applyEdit_merge_sources_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface ApplyEditMutation_applyEdit_merge_sources_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEditMutation_applyEdit_merge_sources_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface ApplyEditMutation_applyEdit_merge_sources_Performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface ApplyEditMutation_applyEdit_merge_sources_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number | null;
  height: number | null;
}

export interface ApplyEditMutation_applyEdit_merge_sources_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: ApplyEditMutation_applyEdit_merge_sources_Performer_birthdate | null;
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
  measurements: ApplyEditMutation_applyEdit_merge_sources_Performer_measurements;
  tattoos: ApplyEditMutation_applyEdit_merge_sources_Performer_tattoos[] | null;
  piercings: ApplyEditMutation_applyEdit_merge_sources_Performer_piercings[] | null;
  urls: ApplyEditMutation_applyEdit_merge_sources_Performer_urls[];
  images: ApplyEditMutation_applyEdit_merge_sources_Performer_images[];
}

export type ApplyEditMutation_applyEdit_merge_sources = ApplyEditMutation_applyEdit_merge_sources_Scene | ApplyEditMutation_applyEdit_merge_sources_Tag | ApplyEditMutation_applyEdit_merge_sources_Performer;

export interface ApplyEditMutation_applyEdit {
  __typename: "Edit";
  id: string;
  target_type: TargetTypeEnum;
  operation: OperationEnum;
  status: VoteStatusEnum;
  applied: boolean;
  created: any;
  comments: ApplyEditMutation_applyEdit_comments[];
  user: ApplyEditMutation_applyEdit_user;
  /**
   * Object being edited - null if creating a new object
   */
  target: ApplyEditMutation_applyEdit_target | null;
  details: ApplyEditMutation_applyEdit_details | null;
  /**
   * Previous state of fields being modified - null if operation is create or delete.
   */
  old_details: ApplyEditMutation_applyEdit_old_details | null;
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
