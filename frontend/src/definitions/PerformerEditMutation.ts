/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PerformerEditInput, TargetTypeEnum, OperationEnum, VoteStatusEnum, GenderEnum, DateAccuracyEnum, EthnicityEnum, EyeColorEnum, HairColorEnum, BreastTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: PerformerEditMutation
// ====================================================

export interface PerformerEditMutation_performerEdit_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface PerformerEditMutation_performerEdit_target_Scene {
  __typename: "Scene" | "Studio";
}

export interface PerformerEditMutation_performerEdit_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export interface PerformerEditMutation_performerEdit_target_Performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface PerformerEditMutation_performerEdit_target_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface PerformerEditMutation_performerEdit_target_Performer_measurements {
  __typename: "Measurements";
  cup_size: string | null;
  band_size: number | null;
  waist: number | null;
  hip: number | null;
}

export interface PerformerEditMutation_performerEdit_target_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface PerformerEditMutation_performerEdit_target_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface PerformerEditMutation_performerEdit_target_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number | null;
  height: number | null;
}

export interface PerformerEditMutation_performerEdit_target_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  aliases: string[];
  gender: GenderEnum | null;
  urls: PerformerEditMutation_performerEdit_target_Performer_urls[];
  birthdate: PerformerEditMutation_performerEdit_target_Performer_birthdate | null;
  age: number | null;
  ethnicity: EthnicityEnum | null;
  country: string | null;
  eye_color: EyeColorEnum | null;
  hair_color: HairColorEnum | null;
  /**
   * Height in cm
   */
  height: number | null;
  measurements: PerformerEditMutation_performerEdit_target_Performer_measurements;
  breast_type: BreastTypeEnum | null;
  career_start_year: number | null;
  career_end_year: number | null;
  tattoos: PerformerEditMutation_performerEdit_target_Performer_tattoos[] | null;
  piercings: PerformerEditMutation_performerEdit_target_Performer_piercings[] | null;
  images: PerformerEditMutation_performerEdit_target_Performer_images[];
  deleted: boolean;
}

export type PerformerEditMutation_performerEdit_target = PerformerEditMutation_performerEdit_target_Scene | PerformerEditMutation_performerEdit_target_Tag | PerformerEditMutation_performerEdit_target_Performer;

export interface PerformerEditMutation_performerEdit_details_SceneEdit {
  __typename: "SceneEdit" | "StudioEdit";
}

export interface PerformerEditMutation_performerEdit_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
}

export interface PerformerEditMutation_performerEdit_details_PerformerEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface PerformerEditMutation_performerEdit_details_PerformerEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface PerformerEditMutation_performerEdit_details_PerformerEdit_added_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface PerformerEditMutation_performerEdit_details_PerformerEdit_removed_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface PerformerEditMutation_performerEdit_details_PerformerEdit_added_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface PerformerEditMutation_performerEdit_details_PerformerEdit_removed_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface PerformerEditMutation_performerEdit_details_PerformerEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number | null;
  height: number | null;
}

export interface PerformerEditMutation_performerEdit_details_PerformerEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number | null;
  height: number | null;
}

export interface PerformerEditMutation_performerEdit_details_PerformerEdit {
  __typename: "PerformerEdit";
  name: string | null;
  disambiguation: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  gender: GenderEnum | null;
  added_urls: PerformerEditMutation_performerEdit_details_PerformerEdit_added_urls[] | null;
  removed_urls: PerformerEditMutation_performerEdit_details_PerformerEdit_removed_urls[] | null;
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
  added_tattoos: PerformerEditMutation_performerEdit_details_PerformerEdit_added_tattoos[] | null;
  removed_tattoos: PerformerEditMutation_performerEdit_details_PerformerEdit_removed_tattoos[] | null;
  added_piercings: PerformerEditMutation_performerEdit_details_PerformerEdit_added_piercings[] | null;
  removed_piercings: PerformerEditMutation_performerEdit_details_PerformerEdit_removed_piercings[] | null;
  added_images: PerformerEditMutation_performerEdit_details_PerformerEdit_added_images[] | null;
  removed_images: PerformerEditMutation_performerEdit_details_PerformerEdit_removed_images[] | null;
}

export type PerformerEditMutation_performerEdit_details = PerformerEditMutation_performerEdit_details_SceneEdit | PerformerEditMutation_performerEdit_details_TagEdit | PerformerEditMutation_performerEdit_details_PerformerEdit;

export interface PerformerEditMutation_performerEdit_merge_sources_Scene {
  __typename: "Scene" | "Studio";
}

export interface PerformerEditMutation_performerEdit_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
}

export interface PerformerEditMutation_performerEdit_merge_sources_Performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface PerformerEditMutation_performerEdit_merge_sources_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface PerformerEditMutation_performerEdit_merge_sources_Performer_measurements {
  __typename: "Measurements";
  cup_size: string | null;
  band_size: number | null;
  waist: number | null;
  hip: number | null;
}

export interface PerformerEditMutation_performerEdit_merge_sources_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface PerformerEditMutation_performerEdit_merge_sources_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface PerformerEditMutation_performerEdit_merge_sources_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number | null;
  height: number | null;
}

export interface PerformerEditMutation_performerEdit_merge_sources_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  aliases: string[];
  gender: GenderEnum | null;
  urls: PerformerEditMutation_performerEdit_merge_sources_Performer_urls[];
  birthdate: PerformerEditMutation_performerEdit_merge_sources_Performer_birthdate | null;
  age: number | null;
  ethnicity: EthnicityEnum | null;
  country: string | null;
  eye_color: EyeColorEnum | null;
  hair_color: HairColorEnum | null;
  /**
   * Height in cm
   */
  height: number | null;
  measurements: PerformerEditMutation_performerEdit_merge_sources_Performer_measurements;
  breast_type: BreastTypeEnum | null;
  career_start_year: number | null;
  career_end_year: number | null;
  tattoos: PerformerEditMutation_performerEdit_merge_sources_Performer_tattoos[] | null;
  piercings: PerformerEditMutation_performerEdit_merge_sources_Performer_piercings[] | null;
  images: PerformerEditMutation_performerEdit_merge_sources_Performer_images[];
  deleted: boolean;
}

export type PerformerEditMutation_performerEdit_merge_sources = PerformerEditMutation_performerEdit_merge_sources_Scene | PerformerEditMutation_performerEdit_merge_sources_Tag | PerformerEditMutation_performerEdit_merge_sources_Performer;

export interface PerformerEditMutation_performerEdit {
  __typename: "Edit";
  id: string;
  target_type: TargetTypeEnum;
  operation: OperationEnum;
  status: VoteStatusEnum;
  applied: boolean;
  created: any;
  user: PerformerEditMutation_performerEdit_user;
  /**
   * Object being edited - null if creating a new object
   */
  target: PerformerEditMutation_performerEdit_target | null;
  details: PerformerEditMutation_performerEdit_details | null;
  /**
   * Objects to merge with the target. Only applicable to merges
   */
  merge_sources: PerformerEditMutation_performerEdit_merge_sources[];
}

export interface PerformerEditMutation {
  /**
   * Propose a new performer or modification to a performer
   */
  performerEdit: PerformerEditMutation_performerEdit;
}

export interface PerformerEditMutationVariables {
  performerData: PerformerEditInput;
}
