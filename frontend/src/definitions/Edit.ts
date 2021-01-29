/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TargetTypeEnum, OperationEnum, VoteStatusEnum, GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: Edit
// ====================================================

export interface Edit_findEdit_comments_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface Edit_findEdit_comments {
  __typename: "EditComment";
  user: Edit_findEdit_comments_user;
  date: any;
  comment: string;
}

export interface Edit_findEdit_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface Edit_findEdit_target_Scene {
  __typename: "Scene" | "Studio";
}

export interface Edit_findEdit_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export interface Edit_findEdit_target_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface Edit_findEdit_target_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface Edit_findEdit_target_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edit_findEdit_target_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edit_findEdit_target_Performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edit_findEdit_target_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edit_findEdit_target_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: Edit_findEdit_target_Performer_birthdate | null;
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
  measurements: Edit_findEdit_target_Performer_measurements;
  tattoos: Edit_findEdit_target_Performer_tattoos[] | null;
  piercings: Edit_findEdit_target_Performer_piercings[] | null;
  urls: Edit_findEdit_target_Performer_urls[];
  images: Edit_findEdit_target_Performer_images[];
}

export type Edit_findEdit_target = Edit_findEdit_target_Scene | Edit_findEdit_target_Tag | Edit_findEdit_target_Performer;

export interface Edit_findEdit_details_SceneEdit {
  __typename: "SceneEdit" | "StudioEdit";
}

export interface Edit_findEdit_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
}

export interface Edit_findEdit_details_PerformerEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edit_findEdit_details_PerformerEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edit_findEdit_details_PerformerEdit_added_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edit_findEdit_details_PerformerEdit_removed_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edit_findEdit_details_PerformerEdit_added_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edit_findEdit_details_PerformerEdit_removed_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edit_findEdit_details_PerformerEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edit_findEdit_details_PerformerEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edit_findEdit_details_PerformerEdit {
  __typename: "PerformerEdit";
  name: string | null;
  disambiguation: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  gender: GenderEnum | null;
  added_urls: Edit_findEdit_details_PerformerEdit_added_urls[] | null;
  removed_urls: Edit_findEdit_details_PerformerEdit_removed_urls[] | null;
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
  added_tattoos: Edit_findEdit_details_PerformerEdit_added_tattoos[] | null;
  removed_tattoos: Edit_findEdit_details_PerformerEdit_removed_tattoos[] | null;
  added_piercings: Edit_findEdit_details_PerformerEdit_added_piercings[] | null;
  removed_piercings: Edit_findEdit_details_PerformerEdit_removed_piercings[] | null;
  added_images: (Edit_findEdit_details_PerformerEdit_added_images | null)[] | null;
  removed_images: (Edit_findEdit_details_PerformerEdit_removed_images | null)[] | null;
}

export type Edit_findEdit_details = Edit_findEdit_details_SceneEdit | Edit_findEdit_details_TagEdit | Edit_findEdit_details_PerformerEdit;

export interface Edit_findEdit_old_details_SceneEdit {
  __typename: "SceneEdit" | "StudioEdit";
}

export interface Edit_findEdit_old_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
}

export interface Edit_findEdit_old_details_PerformerEdit {
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

export type Edit_findEdit_old_details = Edit_findEdit_old_details_SceneEdit | Edit_findEdit_old_details_TagEdit | Edit_findEdit_old_details_PerformerEdit;

export interface Edit_findEdit_merge_sources_Scene {
  __typename: "Scene" | "Studio";
}

export interface Edit_findEdit_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export interface Edit_findEdit_merge_sources_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface Edit_findEdit_merge_sources_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface Edit_findEdit_merge_sources_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edit_findEdit_merge_sources_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edit_findEdit_merge_sources_Performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edit_findEdit_merge_sources_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edit_findEdit_merge_sources_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: Edit_findEdit_merge_sources_Performer_birthdate | null;
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
  measurements: Edit_findEdit_merge_sources_Performer_measurements;
  tattoos: Edit_findEdit_merge_sources_Performer_tattoos[] | null;
  piercings: Edit_findEdit_merge_sources_Performer_piercings[] | null;
  urls: Edit_findEdit_merge_sources_Performer_urls[];
  images: Edit_findEdit_merge_sources_Performer_images[];
}

export type Edit_findEdit_merge_sources = Edit_findEdit_merge_sources_Scene | Edit_findEdit_merge_sources_Tag | Edit_findEdit_merge_sources_Performer;

export interface Edit_findEdit {
  __typename: "Edit";
  id: string;
  target_type: TargetTypeEnum;
  operation: OperationEnum;
  status: VoteStatusEnum;
  applied: boolean;
  created: any;
  comments: Edit_findEdit_comments[];
  user: Edit_findEdit_user;
  /**
   * Object being edited - null if creating a new object
   */
  target: Edit_findEdit_target | null;
  details: Edit_findEdit_details | null;
  /**
   * Previous state of fields being modified - null if operation is create or delete.
   */
  old_details: Edit_findEdit_old_details | null;
  /**
   * Objects to merge with the target. Only applicable to merges
   */
  merge_sources: Edit_findEdit_merge_sources[];
}

export interface Edit {
  findEdit: Edit_findEdit | null;
}

export interface EditVariables {
  id?: string | null;
}
