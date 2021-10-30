/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TargetTypeEnum, OperationEnum, VoteStatusEnum, VoteTypeEnum, GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL fragment: EditFragment
// ====================================================

export interface EditFragment_comments_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface EditFragment_comments {
  __typename: "EditComment";
  user: EditFragment_comments_user | null;
  date: any;
  comment: string;
}

export interface EditFragment_votes_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface EditFragment_votes {
  __typename: "EditVote";
  user: EditFragment_votes_user;
  date: any;
  vote: VoteTypeEnum;
}

export interface EditFragment_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface EditFragment_target_Tag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface EditFragment_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: EditFragment_target_Tag_category | null;
}

export interface EditFragment_target_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface EditFragment_target_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface EditFragment_target_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_target_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_target_Performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_target_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_target_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: EditFragment_target_Performer_birthdate | null;
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
  measurements: EditFragment_target_Performer_measurements;
  tattoos: EditFragment_target_Performer_tattoos[] | null;
  piercings: EditFragment_target_Performer_piercings[] | null;
  urls: EditFragment_target_Performer_urls[];
  images: EditFragment_target_Performer_images[];
}

export interface EditFragment_target_Studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditFragment_target_Studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditFragment_target_Studio_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_target_Studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface EditFragment_target_Studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: EditFragment_target_Studio_child_studios[];
  parent: EditFragment_target_Studio_parent | null;
  urls: EditFragment_target_Studio_urls[];
  images: EditFragment_target_Studio_images[];
  deleted: boolean;
}

export interface EditFragment_target_Scene_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_target_Scene_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_target_Scene_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditFragment_target_Scene_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface EditFragment_target_Scene_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: EditFragment_target_Scene_performers_performer;
}

export interface EditFragment_target_Scene_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  user_submitted: boolean;
  created: any;
  updated: any;
}

export interface EditFragment_target_Scene_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface EditFragment_target_Scene {
  __typename: "Scene";
  id: string;
  date: any | null;
  title: string | null;
  deleted: boolean;
  details: string | null;
  director: string | null;
  duration: number | null;
  urls: EditFragment_target_Scene_urls[];
  images: EditFragment_target_Scene_images[];
  studio: EditFragment_target_Scene_studio | null;
  performers: EditFragment_target_Scene_performers[];
  fingerprints: EditFragment_target_Scene_fingerprints[];
  tags: EditFragment_target_Scene_tags[];
}

export type EditFragment_target = EditFragment_target_Tag | EditFragment_target_Performer | EditFragment_target_Studio | EditFragment_target_Scene;

export interface EditFragment_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  category_id: string | null;
}

export interface EditFragment_details_PerformerEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_details_PerformerEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_details_PerformerEdit_added_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_details_PerformerEdit_removed_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_details_PerformerEdit_added_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_details_PerformerEdit_removed_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_details_PerformerEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_details_PerformerEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_details_PerformerEdit {
  __typename: "PerformerEdit";
  name: string | null;
  disambiguation: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  gender: GenderEnum | null;
  added_urls: EditFragment_details_PerformerEdit_added_urls[] | null;
  removed_urls: EditFragment_details_PerformerEdit_removed_urls[] | null;
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
  added_tattoos: EditFragment_details_PerformerEdit_added_tattoos[] | null;
  removed_tattoos: EditFragment_details_PerformerEdit_removed_tattoos[] | null;
  added_piercings: EditFragment_details_PerformerEdit_added_piercings[] | null;
  removed_piercings: EditFragment_details_PerformerEdit_removed_piercings[] | null;
  added_images: EditFragment_details_PerformerEdit_added_images[] | null;
  removed_images: EditFragment_details_PerformerEdit_removed_images[] | null;
}

export interface EditFragment_details_StudioEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_details_StudioEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_details_StudioEdit_parent_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditFragment_details_StudioEdit_parent_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditFragment_details_StudioEdit_parent_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_details_StudioEdit_parent_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface EditFragment_details_StudioEdit_parent {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: EditFragment_details_StudioEdit_parent_child_studios[];
  parent: EditFragment_details_StudioEdit_parent_parent | null;
  urls: EditFragment_details_StudioEdit_parent_urls[];
  images: EditFragment_details_StudioEdit_parent_images[];
  deleted: boolean;
}

export interface EditFragment_details_StudioEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_details_StudioEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_details_StudioEdit {
  __typename: "StudioEdit";
  name: string | null;
  /**
   * Added and modified URLs
   */
  added_urls: EditFragment_details_StudioEdit_added_urls[] | null;
  removed_urls: EditFragment_details_StudioEdit_removed_urls[] | null;
  parent: EditFragment_details_StudioEdit_parent | null;
  added_images: EditFragment_details_StudioEdit_added_images[] | null;
  removed_images: EditFragment_details_StudioEdit_removed_images[] | null;
}

export interface EditFragment_details_SceneEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_details_SceneEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_details_SceneEdit_studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditFragment_details_SceneEdit_studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditFragment_details_SceneEdit_studio_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_details_SceneEdit_studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface EditFragment_details_SceneEdit_studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: EditFragment_details_SceneEdit_studio_child_studios[];
  parent: EditFragment_details_SceneEdit_studio_parent | null;
  urls: EditFragment_details_SceneEdit_studio_urls[];
  images: EditFragment_details_SceneEdit_studio_images[];
  deleted: boolean;
}

export interface EditFragment_details_SceneEdit_added_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface EditFragment_details_SceneEdit_added_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface EditFragment_details_SceneEdit_added_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_details_SceneEdit_added_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_details_SceneEdit_added_performers_performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_details_SceneEdit_added_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_details_SceneEdit_added_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: EditFragment_details_SceneEdit_added_performers_performer_birthdate | null;
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
  measurements: EditFragment_details_SceneEdit_added_performers_performer_measurements;
  tattoos: EditFragment_details_SceneEdit_added_performers_performer_tattoos[] | null;
  piercings: EditFragment_details_SceneEdit_added_performers_performer_piercings[] | null;
  urls: EditFragment_details_SceneEdit_added_performers_performer_urls[];
  images: EditFragment_details_SceneEdit_added_performers_performer_images[];
}

export interface EditFragment_details_SceneEdit_added_performers {
  __typename: "PerformerAppearance";
  performer: EditFragment_details_SceneEdit_added_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface EditFragment_details_SceneEdit_removed_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface EditFragment_details_SceneEdit_removed_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface EditFragment_details_SceneEdit_removed_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_details_SceneEdit_removed_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_details_SceneEdit_removed_performers_performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_details_SceneEdit_removed_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_details_SceneEdit_removed_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: EditFragment_details_SceneEdit_removed_performers_performer_birthdate | null;
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
  measurements: EditFragment_details_SceneEdit_removed_performers_performer_measurements;
  tattoos: EditFragment_details_SceneEdit_removed_performers_performer_tattoos[] | null;
  piercings: EditFragment_details_SceneEdit_removed_performers_performer_piercings[] | null;
  urls: EditFragment_details_SceneEdit_removed_performers_performer_urls[];
  images: EditFragment_details_SceneEdit_removed_performers_performer_images[];
}

export interface EditFragment_details_SceneEdit_removed_performers {
  __typename: "PerformerAppearance";
  performer: EditFragment_details_SceneEdit_removed_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface EditFragment_details_SceneEdit_added_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface EditFragment_details_SceneEdit_added_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: EditFragment_details_SceneEdit_added_tags_category | null;
}

export interface EditFragment_details_SceneEdit_removed_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface EditFragment_details_SceneEdit_removed_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: EditFragment_details_SceneEdit_removed_tags_category | null;
}

export interface EditFragment_details_SceneEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_details_SceneEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_details_SceneEdit {
  __typename: "SceneEdit";
  title: string | null;
  details: string | null;
  added_urls: EditFragment_details_SceneEdit_added_urls[] | null;
  removed_urls: EditFragment_details_SceneEdit_removed_urls[] | null;
  date: any | null;
  studio: EditFragment_details_SceneEdit_studio | null;
  /**
   * Added or modified performer appearance entries
   */
  added_performers: EditFragment_details_SceneEdit_added_performers[] | null;
  removed_performers: EditFragment_details_SceneEdit_removed_performers[] | null;
  added_tags: EditFragment_details_SceneEdit_added_tags[] | null;
  removed_tags: EditFragment_details_SceneEdit_removed_tags[] | null;
  added_images: EditFragment_details_SceneEdit_added_images[] | null;
  removed_images: EditFragment_details_SceneEdit_removed_images[] | null;
  duration: number | null;
  director: string | null;
}

export type EditFragment_details = EditFragment_details_TagEdit | EditFragment_details_PerformerEdit | EditFragment_details_StudioEdit | EditFragment_details_SceneEdit;

export interface EditFragment_old_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  category_id: string | null;
}

export interface EditFragment_old_details_PerformerEdit {
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

export interface EditFragment_old_details_StudioEdit_parent_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditFragment_old_details_StudioEdit_parent_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditFragment_old_details_StudioEdit_parent_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_old_details_StudioEdit_parent_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface EditFragment_old_details_StudioEdit_parent {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: EditFragment_old_details_StudioEdit_parent_child_studios[];
  parent: EditFragment_old_details_StudioEdit_parent_parent | null;
  urls: EditFragment_old_details_StudioEdit_parent_urls[];
  images: EditFragment_old_details_StudioEdit_parent_images[];
  deleted: boolean;
}

export interface EditFragment_old_details_StudioEdit {
  __typename: "StudioEdit";
  name: string | null;
  parent: EditFragment_old_details_StudioEdit_parent | null;
}

export interface EditFragment_old_details_SceneEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_old_details_SceneEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_old_details_SceneEdit_studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditFragment_old_details_SceneEdit_studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditFragment_old_details_SceneEdit_studio_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_old_details_SceneEdit_studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface EditFragment_old_details_SceneEdit_studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: EditFragment_old_details_SceneEdit_studio_child_studios[];
  parent: EditFragment_old_details_SceneEdit_studio_parent | null;
  urls: EditFragment_old_details_SceneEdit_studio_urls[];
  images: EditFragment_old_details_SceneEdit_studio_images[];
  deleted: boolean;
}

export interface EditFragment_old_details_SceneEdit_added_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface EditFragment_old_details_SceneEdit_added_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface EditFragment_old_details_SceneEdit_added_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_old_details_SceneEdit_added_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_old_details_SceneEdit_added_performers_performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_old_details_SceneEdit_added_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_old_details_SceneEdit_added_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: EditFragment_old_details_SceneEdit_added_performers_performer_birthdate | null;
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
  measurements: EditFragment_old_details_SceneEdit_added_performers_performer_measurements;
  tattoos: EditFragment_old_details_SceneEdit_added_performers_performer_tattoos[] | null;
  piercings: EditFragment_old_details_SceneEdit_added_performers_performer_piercings[] | null;
  urls: EditFragment_old_details_SceneEdit_added_performers_performer_urls[];
  images: EditFragment_old_details_SceneEdit_added_performers_performer_images[];
}

export interface EditFragment_old_details_SceneEdit_added_performers {
  __typename: "PerformerAppearance";
  performer: EditFragment_old_details_SceneEdit_added_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface EditFragment_old_details_SceneEdit_removed_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface EditFragment_old_details_SceneEdit_removed_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface EditFragment_old_details_SceneEdit_removed_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_old_details_SceneEdit_removed_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_old_details_SceneEdit_removed_performers_performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_old_details_SceneEdit_removed_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_old_details_SceneEdit_removed_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: EditFragment_old_details_SceneEdit_removed_performers_performer_birthdate | null;
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
  measurements: EditFragment_old_details_SceneEdit_removed_performers_performer_measurements;
  tattoos: EditFragment_old_details_SceneEdit_removed_performers_performer_tattoos[] | null;
  piercings: EditFragment_old_details_SceneEdit_removed_performers_performer_piercings[] | null;
  urls: EditFragment_old_details_SceneEdit_removed_performers_performer_urls[];
  images: EditFragment_old_details_SceneEdit_removed_performers_performer_images[];
}

export interface EditFragment_old_details_SceneEdit_removed_performers {
  __typename: "PerformerAppearance";
  performer: EditFragment_old_details_SceneEdit_removed_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface EditFragment_old_details_SceneEdit_added_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface EditFragment_old_details_SceneEdit_added_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: EditFragment_old_details_SceneEdit_added_tags_category | null;
}

export interface EditFragment_old_details_SceneEdit_removed_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface EditFragment_old_details_SceneEdit_removed_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: EditFragment_old_details_SceneEdit_removed_tags_category | null;
}

export interface EditFragment_old_details_SceneEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_old_details_SceneEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_old_details_SceneEdit {
  __typename: "SceneEdit";
  title: string | null;
  details: string | null;
  added_urls: EditFragment_old_details_SceneEdit_added_urls[] | null;
  removed_urls: EditFragment_old_details_SceneEdit_removed_urls[] | null;
  date: any | null;
  studio: EditFragment_old_details_SceneEdit_studio | null;
  /**
   * Added or modified performer appearance entries
   */
  added_performers: EditFragment_old_details_SceneEdit_added_performers[] | null;
  removed_performers: EditFragment_old_details_SceneEdit_removed_performers[] | null;
  added_tags: EditFragment_old_details_SceneEdit_added_tags[] | null;
  removed_tags: EditFragment_old_details_SceneEdit_removed_tags[] | null;
  added_images: EditFragment_old_details_SceneEdit_added_images[] | null;
  removed_images: EditFragment_old_details_SceneEdit_removed_images[] | null;
  duration: number | null;
  director: string | null;
}

export type EditFragment_old_details = EditFragment_old_details_TagEdit | EditFragment_old_details_PerformerEdit | EditFragment_old_details_StudioEdit | EditFragment_old_details_SceneEdit;

export interface EditFragment_merge_sources_Tag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface EditFragment_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: EditFragment_merge_sources_Tag_category | null;
}

export interface EditFragment_merge_sources_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface EditFragment_merge_sources_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface EditFragment_merge_sources_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_merge_sources_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditFragment_merge_sources_Performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_merge_sources_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_merge_sources_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: EditFragment_merge_sources_Performer_birthdate | null;
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
  measurements: EditFragment_merge_sources_Performer_measurements;
  tattoos: EditFragment_merge_sources_Performer_tattoos[] | null;
  piercings: EditFragment_merge_sources_Performer_piercings[] | null;
  urls: EditFragment_merge_sources_Performer_urls[];
  images: EditFragment_merge_sources_Performer_images[];
}

export interface EditFragment_merge_sources_Studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditFragment_merge_sources_Studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditFragment_merge_sources_Studio_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_merge_sources_Studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface EditFragment_merge_sources_Studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: EditFragment_merge_sources_Studio_child_studios[];
  parent: EditFragment_merge_sources_Studio_parent | null;
  urls: EditFragment_merge_sources_Studio_urls[];
  images: EditFragment_merge_sources_Studio_images[];
  deleted: boolean;
}

export interface EditFragment_merge_sources_Scene_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditFragment_merge_sources_Scene_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditFragment_merge_sources_Scene_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditFragment_merge_sources_Scene_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface EditFragment_merge_sources_Scene_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: EditFragment_merge_sources_Scene_performers_performer;
}

export interface EditFragment_merge_sources_Scene_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  user_submitted: boolean;
  created: any;
  updated: any;
}

export interface EditFragment_merge_sources_Scene_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface EditFragment_merge_sources_Scene {
  __typename: "Scene";
  id: string;
  date: any | null;
  title: string | null;
  deleted: boolean;
  details: string | null;
  director: string | null;
  duration: number | null;
  urls: EditFragment_merge_sources_Scene_urls[];
  images: EditFragment_merge_sources_Scene_images[];
  studio: EditFragment_merge_sources_Scene_studio | null;
  performers: EditFragment_merge_sources_Scene_performers[];
  fingerprints: EditFragment_merge_sources_Scene_fingerprints[];
  tags: EditFragment_merge_sources_Scene_tags[];
}

export type EditFragment_merge_sources = EditFragment_merge_sources_Tag | EditFragment_merge_sources_Performer | EditFragment_merge_sources_Studio | EditFragment_merge_sources_Scene;

export interface EditFragment_options {
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

export interface EditFragment {
  __typename: "Edit";
  id: string;
  target_type: TargetTypeEnum;
  operation: OperationEnum;
  status: VoteStatusEnum;
  applied: boolean;
  created: any;
  updated: any;
  /**
   *  = Accepted - Rejected
   */
  vote_count: number;
  comments: EditFragment_comments[];
  votes: EditFragment_votes[];
  user: EditFragment_user | null;
  /**
   * Object being edited - null if creating a new object
   */
  target: EditFragment_target | null;
  details: EditFragment_details | null;
  /**
   * Previous state of fields being modified - null if operation is create or delete.
   */
  old_details: EditFragment_old_details | null;
  /**
   * Objects to merge with the target. Only applicable to merges
   */
  merge_sources: EditFragment_merge_sources[];
  /**
   * Entity specific options
   */
  options: EditFragment_options | null;
}
