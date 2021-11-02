/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { QuerySpec, EditFilterType, TargetTypeEnum, OperationEnum, VoteStatusEnum, VoteTypeEnum, GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL query operation: Edits
// ====================================================

export interface Edits_queryEdits_edits_comments_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_comments {
  __typename: "EditComment";
  user: Edits_queryEdits_edits_comments_user | null;
  date: any;
  comment: string;
}

export interface Edits_queryEdits_edits_votes_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_votes {
  __typename: "EditVote";
  user: Edits_queryEdits_edits_votes_user | null;
  date: any;
  vote: VoteTypeEnum;
}

export interface Edits_queryEdits_edits_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_target_Tag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: Edits_queryEdits_edits_target_Tag_category | null;
}

export interface Edits_queryEdits_edits_target_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface Edits_queryEdits_edits_target_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface Edits_queryEdits_edits_target_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_target_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_target_Performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_target_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_target_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: Edits_queryEdits_edits_target_Performer_birthdate | null;
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
  measurements: Edits_queryEdits_edits_target_Performer_measurements;
  tattoos: Edits_queryEdits_edits_target_Performer_tattoos[] | null;
  piercings: Edits_queryEdits_edits_target_Performer_piercings[] | null;
  urls: Edits_queryEdits_edits_target_Performer_urls[];
  images: Edits_queryEdits_edits_target_Performer_images[];
}

export interface Edits_queryEdits_edits_target_Studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_target_Studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_target_Studio_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_target_Studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface Edits_queryEdits_edits_target_Studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: Edits_queryEdits_edits_target_Studio_child_studios[];
  parent: Edits_queryEdits_edits_target_Studio_parent | null;
  urls: Edits_queryEdits_edits_target_Studio_urls[];
  images: Edits_queryEdits_edits_target_Studio_images[];
  deleted: boolean;
}

export interface Edits_queryEdits_edits_target_Scene_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_target_Scene_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_target_Scene_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_target_Scene_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface Edits_queryEdits_edits_target_Scene_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: Edits_queryEdits_edits_target_Scene_performers_performer;
}

export interface Edits_queryEdits_edits_target_Scene_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  user_submitted: boolean;
  created: any;
  updated: any;
}

export interface Edits_queryEdits_edits_target_Scene_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_target_Scene {
  __typename: "Scene";
  id: string;
  date: any | null;
  title: string | null;
  deleted: boolean;
  details: string | null;
  director: string | null;
  duration: number | null;
  urls: Edits_queryEdits_edits_target_Scene_urls[];
  images: Edits_queryEdits_edits_target_Scene_images[];
  studio: Edits_queryEdits_edits_target_Scene_studio | null;
  performers: Edits_queryEdits_edits_target_Scene_performers[];
  fingerprints: Edits_queryEdits_edits_target_Scene_fingerprints[];
  tags: Edits_queryEdits_edits_target_Scene_tags[];
}

export type Edits_queryEdits_edits_target = Edits_queryEdits_edits_target_Tag | Edits_queryEdits_edits_target_Performer | Edits_queryEdits_edits_target_Studio | Edits_queryEdits_edits_target_Scene;

export interface Edits_queryEdits_edits_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  category_id: string | null;
}

export interface Edits_queryEdits_edits_details_PerformerEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_details_PerformerEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_details_PerformerEdit_added_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_details_PerformerEdit_removed_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_details_PerformerEdit_added_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_details_PerformerEdit_removed_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_details_PerformerEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_details_PerformerEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_details_PerformerEdit {
  __typename: "PerformerEdit";
  name: string | null;
  disambiguation: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  gender: GenderEnum | null;
  added_urls: Edits_queryEdits_edits_details_PerformerEdit_added_urls[] | null;
  removed_urls: Edits_queryEdits_edits_details_PerformerEdit_removed_urls[] | null;
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
  added_tattoos: Edits_queryEdits_edits_details_PerformerEdit_added_tattoos[] | null;
  removed_tattoos: Edits_queryEdits_edits_details_PerformerEdit_removed_tattoos[] | null;
  added_piercings: Edits_queryEdits_edits_details_PerformerEdit_added_piercings[] | null;
  removed_piercings: Edits_queryEdits_edits_details_PerformerEdit_removed_piercings[] | null;
  added_images: Edits_queryEdits_edits_details_PerformerEdit_added_images[] | null;
  removed_images: Edits_queryEdits_edits_details_PerformerEdit_removed_images[] | null;
}

export interface Edits_queryEdits_edits_details_StudioEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_details_StudioEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_details_StudioEdit_parent_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_details_StudioEdit_parent_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_details_StudioEdit_parent_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_details_StudioEdit_parent_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface Edits_queryEdits_edits_details_StudioEdit_parent {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: Edits_queryEdits_edits_details_StudioEdit_parent_child_studios[];
  parent: Edits_queryEdits_edits_details_StudioEdit_parent_parent | null;
  urls: Edits_queryEdits_edits_details_StudioEdit_parent_urls[];
  images: Edits_queryEdits_edits_details_StudioEdit_parent_images[];
  deleted: boolean;
}

export interface Edits_queryEdits_edits_details_StudioEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_details_StudioEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_details_StudioEdit {
  __typename: "StudioEdit";
  name: string | null;
  /**
   * Added and modified URLs
   */
  added_urls: Edits_queryEdits_edits_details_StudioEdit_added_urls[] | null;
  removed_urls: Edits_queryEdits_edits_details_StudioEdit_removed_urls[] | null;
  parent: Edits_queryEdits_edits_details_StudioEdit_parent | null;
  added_images: Edits_queryEdits_edits_details_StudioEdit_added_images[] | null;
  removed_images: Edits_queryEdits_edits_details_StudioEdit_removed_images[] | null;
}

export interface Edits_queryEdits_edits_details_SceneEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_details_SceneEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_details_SceneEdit_studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_details_SceneEdit_studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_details_SceneEdit_studio_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_details_SceneEdit_studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface Edits_queryEdits_edits_details_SceneEdit_studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: Edits_queryEdits_edits_details_SceneEdit_studio_child_studios[];
  parent: Edits_queryEdits_edits_details_SceneEdit_studio_parent | null;
  urls: Edits_queryEdits_edits_details_SceneEdit_studio_urls[];
  images: Edits_queryEdits_edits_details_SceneEdit_studio_images[];
  deleted: boolean;
}

export interface Edits_queryEdits_edits_details_SceneEdit_added_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface Edits_queryEdits_edits_details_SceneEdit_added_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface Edits_queryEdits_edits_details_SceneEdit_added_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_details_SceneEdit_added_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_details_SceneEdit_added_performers_performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_details_SceneEdit_added_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_details_SceneEdit_added_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: Edits_queryEdits_edits_details_SceneEdit_added_performers_performer_birthdate | null;
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
  measurements: Edits_queryEdits_edits_details_SceneEdit_added_performers_performer_measurements;
  tattoos: Edits_queryEdits_edits_details_SceneEdit_added_performers_performer_tattoos[] | null;
  piercings: Edits_queryEdits_edits_details_SceneEdit_added_performers_performer_piercings[] | null;
  urls: Edits_queryEdits_edits_details_SceneEdit_added_performers_performer_urls[];
  images: Edits_queryEdits_edits_details_SceneEdit_added_performers_performer_images[];
}

export interface Edits_queryEdits_edits_details_SceneEdit_added_performers {
  __typename: "PerformerAppearance";
  performer: Edits_queryEdits_edits_details_SceneEdit_added_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface Edits_queryEdits_edits_details_SceneEdit_removed_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface Edits_queryEdits_edits_details_SceneEdit_removed_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface Edits_queryEdits_edits_details_SceneEdit_removed_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_details_SceneEdit_removed_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_details_SceneEdit_removed_performers_performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_details_SceneEdit_removed_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_details_SceneEdit_removed_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: Edits_queryEdits_edits_details_SceneEdit_removed_performers_performer_birthdate | null;
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
  measurements: Edits_queryEdits_edits_details_SceneEdit_removed_performers_performer_measurements;
  tattoos: Edits_queryEdits_edits_details_SceneEdit_removed_performers_performer_tattoos[] | null;
  piercings: Edits_queryEdits_edits_details_SceneEdit_removed_performers_performer_piercings[] | null;
  urls: Edits_queryEdits_edits_details_SceneEdit_removed_performers_performer_urls[];
  images: Edits_queryEdits_edits_details_SceneEdit_removed_performers_performer_images[];
}

export interface Edits_queryEdits_edits_details_SceneEdit_removed_performers {
  __typename: "PerformerAppearance";
  performer: Edits_queryEdits_edits_details_SceneEdit_removed_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface Edits_queryEdits_edits_details_SceneEdit_added_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_details_SceneEdit_added_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: Edits_queryEdits_edits_details_SceneEdit_added_tags_category | null;
}

export interface Edits_queryEdits_edits_details_SceneEdit_removed_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_details_SceneEdit_removed_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: Edits_queryEdits_edits_details_SceneEdit_removed_tags_category | null;
}

export interface Edits_queryEdits_edits_details_SceneEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_details_SceneEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_details_SceneEdit {
  __typename: "SceneEdit";
  title: string | null;
  details: string | null;
  added_urls: Edits_queryEdits_edits_details_SceneEdit_added_urls[] | null;
  removed_urls: Edits_queryEdits_edits_details_SceneEdit_removed_urls[] | null;
  date: any | null;
  studio: Edits_queryEdits_edits_details_SceneEdit_studio | null;
  /**
   * Added or modified performer appearance entries
   */
  added_performers: Edits_queryEdits_edits_details_SceneEdit_added_performers[] | null;
  removed_performers: Edits_queryEdits_edits_details_SceneEdit_removed_performers[] | null;
  added_tags: Edits_queryEdits_edits_details_SceneEdit_added_tags[] | null;
  removed_tags: Edits_queryEdits_edits_details_SceneEdit_removed_tags[] | null;
  added_images: Edits_queryEdits_edits_details_SceneEdit_added_images[] | null;
  removed_images: Edits_queryEdits_edits_details_SceneEdit_removed_images[] | null;
  duration: number | null;
  director: string | null;
}

export type Edits_queryEdits_edits_details = Edits_queryEdits_edits_details_TagEdit | Edits_queryEdits_edits_details_PerformerEdit | Edits_queryEdits_edits_details_StudioEdit | Edits_queryEdits_edits_details_SceneEdit;

export interface Edits_queryEdits_edits_old_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  category_id: string | null;
}

export interface Edits_queryEdits_edits_old_details_PerformerEdit {
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

export interface Edits_queryEdits_edits_old_details_StudioEdit_parent_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_old_details_StudioEdit_parent_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_old_details_StudioEdit_parent_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_old_details_StudioEdit_parent_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface Edits_queryEdits_edits_old_details_StudioEdit_parent {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: Edits_queryEdits_edits_old_details_StudioEdit_parent_child_studios[];
  parent: Edits_queryEdits_edits_old_details_StudioEdit_parent_parent | null;
  urls: Edits_queryEdits_edits_old_details_StudioEdit_parent_urls[];
  images: Edits_queryEdits_edits_old_details_StudioEdit_parent_images[];
  deleted: boolean;
}

export interface Edits_queryEdits_edits_old_details_StudioEdit {
  __typename: "StudioEdit";
  name: string | null;
  parent: Edits_queryEdits_edits_old_details_StudioEdit_parent | null;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_studio_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: Edits_queryEdits_edits_old_details_SceneEdit_studio_child_studios[];
  parent: Edits_queryEdits_edits_old_details_SceneEdit_studio_parent | null;
  urls: Edits_queryEdits_edits_old_details_SceneEdit_studio_urls[];
  images: Edits_queryEdits_edits_old_details_SceneEdit_studio_images[];
  deleted: boolean;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_added_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_added_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_added_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_added_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_added_performers_performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_added_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_added_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: Edits_queryEdits_edits_old_details_SceneEdit_added_performers_performer_birthdate | null;
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
  measurements: Edits_queryEdits_edits_old_details_SceneEdit_added_performers_performer_measurements;
  tattoos: Edits_queryEdits_edits_old_details_SceneEdit_added_performers_performer_tattoos[] | null;
  piercings: Edits_queryEdits_edits_old_details_SceneEdit_added_performers_performer_piercings[] | null;
  urls: Edits_queryEdits_edits_old_details_SceneEdit_added_performers_performer_urls[];
  images: Edits_queryEdits_edits_old_details_SceneEdit_added_performers_performer_images[];
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_added_performers {
  __typename: "PerformerAppearance";
  performer: Edits_queryEdits_edits_old_details_SceneEdit_added_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_removed_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_removed_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_removed_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_removed_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_removed_performers_performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_removed_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_removed_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: Edits_queryEdits_edits_old_details_SceneEdit_removed_performers_performer_birthdate | null;
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
  measurements: Edits_queryEdits_edits_old_details_SceneEdit_removed_performers_performer_measurements;
  tattoos: Edits_queryEdits_edits_old_details_SceneEdit_removed_performers_performer_tattoos[] | null;
  piercings: Edits_queryEdits_edits_old_details_SceneEdit_removed_performers_performer_piercings[] | null;
  urls: Edits_queryEdits_edits_old_details_SceneEdit_removed_performers_performer_urls[];
  images: Edits_queryEdits_edits_old_details_SceneEdit_removed_performers_performer_images[];
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_removed_performers {
  __typename: "PerformerAppearance";
  performer: Edits_queryEdits_edits_old_details_SceneEdit_removed_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_added_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_added_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: Edits_queryEdits_edits_old_details_SceneEdit_added_tags_category | null;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_removed_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_removed_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: Edits_queryEdits_edits_old_details_SceneEdit_removed_tags_category | null;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_old_details_SceneEdit {
  __typename: "SceneEdit";
  title: string | null;
  details: string | null;
  added_urls: Edits_queryEdits_edits_old_details_SceneEdit_added_urls[] | null;
  removed_urls: Edits_queryEdits_edits_old_details_SceneEdit_removed_urls[] | null;
  date: any | null;
  studio: Edits_queryEdits_edits_old_details_SceneEdit_studio | null;
  /**
   * Added or modified performer appearance entries
   */
  added_performers: Edits_queryEdits_edits_old_details_SceneEdit_added_performers[] | null;
  removed_performers: Edits_queryEdits_edits_old_details_SceneEdit_removed_performers[] | null;
  added_tags: Edits_queryEdits_edits_old_details_SceneEdit_added_tags[] | null;
  removed_tags: Edits_queryEdits_edits_old_details_SceneEdit_removed_tags[] | null;
  added_images: Edits_queryEdits_edits_old_details_SceneEdit_added_images[] | null;
  removed_images: Edits_queryEdits_edits_old_details_SceneEdit_removed_images[] | null;
  duration: number | null;
  director: string | null;
}

export type Edits_queryEdits_edits_old_details = Edits_queryEdits_edits_old_details_TagEdit | Edits_queryEdits_edits_old_details_PerformerEdit | Edits_queryEdits_edits_old_details_StudioEdit | Edits_queryEdits_edits_old_details_SceneEdit;

export interface Edits_queryEdits_edits_merge_sources_Tag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: Edits_queryEdits_edits_merge_sources_Tag_category | null;
}

export interface Edits_queryEdits_edits_merge_sources_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface Edits_queryEdits_edits_merge_sources_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface Edits_queryEdits_edits_merge_sources_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_merge_sources_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_merge_sources_Performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_merge_sources_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_merge_sources_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: Edits_queryEdits_edits_merge_sources_Performer_birthdate | null;
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
  measurements: Edits_queryEdits_edits_merge_sources_Performer_measurements;
  tattoos: Edits_queryEdits_edits_merge_sources_Performer_tattoos[] | null;
  piercings: Edits_queryEdits_edits_merge_sources_Performer_piercings[] | null;
  urls: Edits_queryEdits_edits_merge_sources_Performer_urls[];
  images: Edits_queryEdits_edits_merge_sources_Performer_images[];
}

export interface Edits_queryEdits_edits_merge_sources_Studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_merge_sources_Studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_merge_sources_Studio_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_merge_sources_Studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface Edits_queryEdits_edits_merge_sources_Studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: Edits_queryEdits_edits_merge_sources_Studio_child_studios[];
  parent: Edits_queryEdits_edits_merge_sources_Studio_parent | null;
  urls: Edits_queryEdits_edits_merge_sources_Studio_urls[];
  images: Edits_queryEdits_edits_merge_sources_Studio_images[];
  deleted: boolean;
}

export interface Edits_queryEdits_edits_merge_sources_Scene_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Edits_queryEdits_edits_merge_sources_Scene_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Edits_queryEdits_edits_merge_sources_Scene_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Edits_queryEdits_edits_merge_sources_Scene_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface Edits_queryEdits_edits_merge_sources_Scene_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: Edits_queryEdits_edits_merge_sources_Scene_performers_performer;
}

export interface Edits_queryEdits_edits_merge_sources_Scene_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  user_submitted: boolean;
  created: any;
  updated: any;
}

export interface Edits_queryEdits_edits_merge_sources_Scene_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface Edits_queryEdits_edits_merge_sources_Scene {
  __typename: "Scene";
  id: string;
  date: any | null;
  title: string | null;
  deleted: boolean;
  details: string | null;
  director: string | null;
  duration: number | null;
  urls: Edits_queryEdits_edits_merge_sources_Scene_urls[];
  images: Edits_queryEdits_edits_merge_sources_Scene_images[];
  studio: Edits_queryEdits_edits_merge_sources_Scene_studio | null;
  performers: Edits_queryEdits_edits_merge_sources_Scene_performers[];
  fingerprints: Edits_queryEdits_edits_merge_sources_Scene_fingerprints[];
  tags: Edits_queryEdits_edits_merge_sources_Scene_tags[];
}

export type Edits_queryEdits_edits_merge_sources = Edits_queryEdits_edits_merge_sources_Tag | Edits_queryEdits_edits_merge_sources_Performer | Edits_queryEdits_edits_merge_sources_Studio | Edits_queryEdits_edits_merge_sources_Scene;

export interface Edits_queryEdits_edits_options {
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

export interface Edits_queryEdits_edits {
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
  comments: Edits_queryEdits_edits_comments[];
  votes: Edits_queryEdits_edits_votes[];
  user: Edits_queryEdits_edits_user | null;
  /**
   * Object being edited - null if creating a new object
   */
  target: Edits_queryEdits_edits_target | null;
  details: Edits_queryEdits_edits_details | null;
  /**
   * Previous state of fields being modified - null if operation is create or delete.
   */
  old_details: Edits_queryEdits_edits_old_details | null;
  /**
   * Objects to merge with the target. Only applicable to merges
   */
  merge_sources: Edits_queryEdits_edits_merge_sources[];
  /**
   * Entity specific options
   */
  options: Edits_queryEdits_edits_options | null;
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
