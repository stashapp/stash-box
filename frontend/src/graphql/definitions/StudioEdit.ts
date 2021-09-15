/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { StudioEditInput, TargetTypeEnum, OperationEnum, VoteStatusEnum, GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: StudioEdit
// ====================================================

export interface StudioEdit_studioEdit_comments_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface StudioEdit_studioEdit_comments {
  __typename: "EditComment";
  user: StudioEdit_studioEdit_comments_user | null;
  date: any;
  comment: string;
}

export interface StudioEdit_studioEdit_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface StudioEdit_studioEdit_target_Scene {
  __typename: "Scene";
}

export interface StudioEdit_studioEdit_target_Tag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface StudioEdit_studioEdit_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: StudioEdit_studioEdit_target_Tag_category | null;
}

export interface StudioEdit_studioEdit_target_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface StudioEdit_studioEdit_target_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface StudioEdit_studioEdit_target_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface StudioEdit_studioEdit_target_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface StudioEdit_studioEdit_target_Performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface StudioEdit_studioEdit_target_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface StudioEdit_studioEdit_target_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: StudioEdit_studioEdit_target_Performer_birthdate | null;
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
  measurements: StudioEdit_studioEdit_target_Performer_measurements;
  tattoos: StudioEdit_studioEdit_target_Performer_tattoos[] | null;
  piercings: StudioEdit_studioEdit_target_Performer_piercings[] | null;
  urls: StudioEdit_studioEdit_target_Performer_urls[];
  images: StudioEdit_studioEdit_target_Performer_images[];
}

export interface StudioEdit_studioEdit_target_Studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface StudioEdit_studioEdit_target_Studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface StudioEdit_studioEdit_target_Studio_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface StudioEdit_studioEdit_target_Studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface StudioEdit_studioEdit_target_Studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: StudioEdit_studioEdit_target_Studio_child_studios[];
  parent: StudioEdit_studioEdit_target_Studio_parent | null;
  urls: StudioEdit_studioEdit_target_Studio_urls[];
  images: StudioEdit_studioEdit_target_Studio_images[];
  deleted: boolean;
}

export type StudioEdit_studioEdit_target = StudioEdit_studioEdit_target_Scene | StudioEdit_studioEdit_target_Tag | StudioEdit_studioEdit_target_Performer | StudioEdit_studioEdit_target_Studio;

export interface StudioEdit_studioEdit_details_SceneEdit {
  __typename: "SceneEdit";
}

export interface StudioEdit_studioEdit_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  category_id: string | null;
}

export interface StudioEdit_studioEdit_details_PerformerEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface StudioEdit_studioEdit_details_PerformerEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface StudioEdit_studioEdit_details_PerformerEdit_added_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface StudioEdit_studioEdit_details_PerformerEdit_removed_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface StudioEdit_studioEdit_details_PerformerEdit_added_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface StudioEdit_studioEdit_details_PerformerEdit_removed_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface StudioEdit_studioEdit_details_PerformerEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface StudioEdit_studioEdit_details_PerformerEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface StudioEdit_studioEdit_details_PerformerEdit {
  __typename: "PerformerEdit";
  name: string | null;
  disambiguation: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  gender: GenderEnum | null;
  added_urls: StudioEdit_studioEdit_details_PerformerEdit_added_urls[] | null;
  removed_urls: StudioEdit_studioEdit_details_PerformerEdit_removed_urls[] | null;
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
  added_tattoos: StudioEdit_studioEdit_details_PerformerEdit_added_tattoos[] | null;
  removed_tattoos: StudioEdit_studioEdit_details_PerformerEdit_removed_tattoos[] | null;
  added_piercings: StudioEdit_studioEdit_details_PerformerEdit_added_piercings[] | null;
  removed_piercings: StudioEdit_studioEdit_details_PerformerEdit_removed_piercings[] | null;
  added_images: (StudioEdit_studioEdit_details_PerformerEdit_added_images | null)[] | null;
  removed_images: (StudioEdit_studioEdit_details_PerformerEdit_removed_images | null)[] | null;
}

export interface StudioEdit_studioEdit_details_StudioEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface StudioEdit_studioEdit_details_StudioEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface StudioEdit_studioEdit_details_StudioEdit_parent_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface StudioEdit_studioEdit_details_StudioEdit_parent_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface StudioEdit_studioEdit_details_StudioEdit_parent_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface StudioEdit_studioEdit_details_StudioEdit_parent_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface StudioEdit_studioEdit_details_StudioEdit_parent {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: StudioEdit_studioEdit_details_StudioEdit_parent_child_studios[];
  parent: StudioEdit_studioEdit_details_StudioEdit_parent_parent | null;
  urls: StudioEdit_studioEdit_details_StudioEdit_parent_urls[];
  images: StudioEdit_studioEdit_details_StudioEdit_parent_images[];
  deleted: boolean;
}

export interface StudioEdit_studioEdit_details_StudioEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface StudioEdit_studioEdit_details_StudioEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface StudioEdit_studioEdit_details_StudioEdit {
  __typename: "StudioEdit";
  name: string | null;
  /**
   * Added and modified URLs
   */
  added_urls: StudioEdit_studioEdit_details_StudioEdit_added_urls[] | null;
  removed_urls: StudioEdit_studioEdit_details_StudioEdit_removed_urls[] | null;
  parent: StudioEdit_studioEdit_details_StudioEdit_parent | null;
  added_images: (StudioEdit_studioEdit_details_StudioEdit_added_images | null)[] | null;
  removed_images: (StudioEdit_studioEdit_details_StudioEdit_removed_images | null)[] | null;
}

export type StudioEdit_studioEdit_details = StudioEdit_studioEdit_details_SceneEdit | StudioEdit_studioEdit_details_TagEdit | StudioEdit_studioEdit_details_PerformerEdit | StudioEdit_studioEdit_details_StudioEdit;

export interface StudioEdit_studioEdit_old_details_SceneEdit {
  __typename: "SceneEdit";
}

export interface StudioEdit_studioEdit_old_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  category_id: string | null;
}

export interface StudioEdit_studioEdit_old_details_PerformerEdit {
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

export interface StudioEdit_studioEdit_old_details_StudioEdit_parent_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface StudioEdit_studioEdit_old_details_StudioEdit_parent_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface StudioEdit_studioEdit_old_details_StudioEdit_parent_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface StudioEdit_studioEdit_old_details_StudioEdit_parent_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface StudioEdit_studioEdit_old_details_StudioEdit_parent {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: StudioEdit_studioEdit_old_details_StudioEdit_parent_child_studios[];
  parent: StudioEdit_studioEdit_old_details_StudioEdit_parent_parent | null;
  urls: StudioEdit_studioEdit_old_details_StudioEdit_parent_urls[];
  images: StudioEdit_studioEdit_old_details_StudioEdit_parent_images[];
  deleted: boolean;
}

export interface StudioEdit_studioEdit_old_details_StudioEdit {
  __typename: "StudioEdit";
  name: string | null;
  parent: StudioEdit_studioEdit_old_details_StudioEdit_parent | null;
}

export type StudioEdit_studioEdit_old_details = StudioEdit_studioEdit_old_details_SceneEdit | StudioEdit_studioEdit_old_details_TagEdit | StudioEdit_studioEdit_old_details_PerformerEdit | StudioEdit_studioEdit_old_details_StudioEdit;

export interface StudioEdit_studioEdit_merge_sources_Scene {
  __typename: "Scene";
}

export interface StudioEdit_studioEdit_merge_sources_Tag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface StudioEdit_studioEdit_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: StudioEdit_studioEdit_merge_sources_Tag_category | null;
}

export interface StudioEdit_studioEdit_merge_sources_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface StudioEdit_studioEdit_merge_sources_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface StudioEdit_studioEdit_merge_sources_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface StudioEdit_studioEdit_merge_sources_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface StudioEdit_studioEdit_merge_sources_Performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface StudioEdit_studioEdit_merge_sources_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface StudioEdit_studioEdit_merge_sources_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: StudioEdit_studioEdit_merge_sources_Performer_birthdate | null;
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
  measurements: StudioEdit_studioEdit_merge_sources_Performer_measurements;
  tattoos: StudioEdit_studioEdit_merge_sources_Performer_tattoos[] | null;
  piercings: StudioEdit_studioEdit_merge_sources_Performer_piercings[] | null;
  urls: StudioEdit_studioEdit_merge_sources_Performer_urls[];
  images: StudioEdit_studioEdit_merge_sources_Performer_images[];
}

export interface StudioEdit_studioEdit_merge_sources_Studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface StudioEdit_studioEdit_merge_sources_Studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface StudioEdit_studioEdit_merge_sources_Studio_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface StudioEdit_studioEdit_merge_sources_Studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface StudioEdit_studioEdit_merge_sources_Studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: StudioEdit_studioEdit_merge_sources_Studio_child_studios[];
  parent: StudioEdit_studioEdit_merge_sources_Studio_parent | null;
  urls: StudioEdit_studioEdit_merge_sources_Studio_urls[];
  images: StudioEdit_studioEdit_merge_sources_Studio_images[];
  deleted: boolean;
}

export type StudioEdit_studioEdit_merge_sources = StudioEdit_studioEdit_merge_sources_Scene | StudioEdit_studioEdit_merge_sources_Tag | StudioEdit_studioEdit_merge_sources_Performer | StudioEdit_studioEdit_merge_sources_Studio;

export interface StudioEdit_studioEdit_options {
  __typename: "PerformerEditOptions";
  /**
   * Set performer alias on scenes without alias to old name if name is changed
   */
  set_modify_aliases: boolean;
  /**
   * Set performer alias on scenes attached to merge sources to old name
   */
  set_merge_aliases: boolean;
}

export interface StudioEdit_studioEdit {
  __typename: "Edit";
  id: string;
  target_type: TargetTypeEnum;
  operation: OperationEnum;
  status: VoteStatusEnum;
  applied: boolean;
  created: any;
  updated: any;
  comments: StudioEdit_studioEdit_comments[];
  user: StudioEdit_studioEdit_user | null;
  /**
   * Object being edited - null if creating a new object
   */
  target: StudioEdit_studioEdit_target | null;
  details: StudioEdit_studioEdit_details | null;
  /**
   * Previous state of fields being modified - null if operation is create or delete.
   */
  old_details: StudioEdit_studioEdit_old_details | null;
  /**
   * Objects to merge with the target. Only applicable to merges
   */
  merge_sources: StudioEdit_studioEdit_merge_sources[];
  /**
   * Entity specific options
   */
  options: StudioEdit_studioEdit_options | null;
}

export interface StudioEdit {
  /**
   * Propose a new studio or modification to a studio
   */
  studioEdit: StudioEdit_studioEdit;
}

export interface StudioEditVariables {
  studioData: StudioEditInput;
}
