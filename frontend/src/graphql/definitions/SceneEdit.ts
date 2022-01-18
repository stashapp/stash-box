/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SceneEditInput, TargetTypeEnum, OperationEnum, VoteStatusEnum, VoteTypeEnum, GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: SceneEdit
// ====================================================

export interface SceneEdit_sceneEdit_comments_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_comments {
  __typename: "EditComment";
  id: string;
  user: SceneEdit_sceneEdit_comments_user | null;
  date: any;
  comment: string;
}

export interface SceneEdit_sceneEdit_votes_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_votes {
  __typename: "EditVote";
  user: SceneEdit_sceneEdit_votes_user | null;
  date: any;
  vote: VoteTypeEnum;
}

export interface SceneEdit_sceneEdit_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_target_Tag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: SceneEdit_sceneEdit_target_Tag_category | null;
}

export interface SceneEdit_sceneEdit_target_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface SceneEdit_sceneEdit_target_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface SceneEdit_sceneEdit_target_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_target_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_target_Performer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_target_Performer_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_target_Performer_urls_site;
}

export interface SceneEdit_sceneEdit_target_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_target_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: SceneEdit_sceneEdit_target_Performer_birthdate | null;
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
  measurements: SceneEdit_sceneEdit_target_Performer_measurements;
  tattoos: SceneEdit_sceneEdit_target_Performer_tattoos[] | null;
  piercings: SceneEdit_sceneEdit_target_Performer_piercings[] | null;
  urls: SceneEdit_sceneEdit_target_Performer_urls[];
  images: SceneEdit_sceneEdit_target_Performer_images[];
  is_favorite: boolean;
}

export interface SceneEdit_sceneEdit_target_Studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_target_Studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_target_Studio_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_target_Studio_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_target_Studio_urls_site;
}

export interface SceneEdit_sceneEdit_target_Studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface SceneEdit_sceneEdit_target_Studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: SceneEdit_sceneEdit_target_Studio_child_studios[];
  parent: SceneEdit_sceneEdit_target_Studio_parent | null;
  urls: SceneEdit_sceneEdit_target_Studio_urls[];
  images: SceneEdit_sceneEdit_target_Studio_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface SceneEdit_sceneEdit_target_Scene_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_target_Scene_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_target_Scene_urls_site;
}

export interface SceneEdit_sceneEdit_target_Scene_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_target_Scene_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_target_Scene_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface SceneEdit_sceneEdit_target_Scene_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: SceneEdit_sceneEdit_target_Scene_performers_performer;
}

export interface SceneEdit_sceneEdit_target_Scene_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  user_submitted: boolean;
  created: any;
  updated: any;
}

export interface SceneEdit_sceneEdit_target_Scene_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_target_Scene {
  __typename: "Scene";
  id: string;
  date: any | null;
  title: string | null;
  deleted: boolean;
  details: string | null;
  director: string | null;
  duration: number | null;
  urls: SceneEdit_sceneEdit_target_Scene_urls[];
  images: SceneEdit_sceneEdit_target_Scene_images[];
  studio: SceneEdit_sceneEdit_target_Scene_studio | null;
  performers: SceneEdit_sceneEdit_target_Scene_performers[];
  fingerprints: SceneEdit_sceneEdit_target_Scene_fingerprints[];
  tags: SceneEdit_sceneEdit_target_Scene_tags[];
}

export type SceneEdit_sceneEdit_target = SceneEdit_sceneEdit_target_Tag | SceneEdit_sceneEdit_target_Performer | SceneEdit_sceneEdit_target_Studio | SceneEdit_sceneEdit_target_Scene;

export interface SceneEdit_sceneEdit_details_TagEdit_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  category: SceneEdit_sceneEdit_details_TagEdit_category | null;
}

export interface SceneEdit_sceneEdit_details_PerformerEdit_added_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_details_PerformerEdit_added_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_details_PerformerEdit_added_urls_site;
}

export interface SceneEdit_sceneEdit_details_PerformerEdit_removed_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_details_PerformerEdit_removed_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_details_PerformerEdit_removed_urls_site;
}

export interface SceneEdit_sceneEdit_details_PerformerEdit_added_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_details_PerformerEdit_removed_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_details_PerformerEdit_added_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_details_PerformerEdit_removed_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_details_PerformerEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_details_PerformerEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_details_PerformerEdit {
  __typename: "PerformerEdit";
  name: string | null;
  disambiguation: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  gender: GenderEnum | null;
  added_urls: SceneEdit_sceneEdit_details_PerformerEdit_added_urls[] | null;
  removed_urls: SceneEdit_sceneEdit_details_PerformerEdit_removed_urls[] | null;
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
  added_tattoos: SceneEdit_sceneEdit_details_PerformerEdit_added_tattoos[] | null;
  removed_tattoos: SceneEdit_sceneEdit_details_PerformerEdit_removed_tattoos[] | null;
  added_piercings: SceneEdit_sceneEdit_details_PerformerEdit_added_piercings[] | null;
  removed_piercings: SceneEdit_sceneEdit_details_PerformerEdit_removed_piercings[] | null;
  added_images: SceneEdit_sceneEdit_details_PerformerEdit_added_images[] | null;
  removed_images: SceneEdit_sceneEdit_details_PerformerEdit_removed_images[] | null;
}

export interface SceneEdit_sceneEdit_details_StudioEdit_added_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_details_StudioEdit_added_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_details_StudioEdit_added_urls_site;
}

export interface SceneEdit_sceneEdit_details_StudioEdit_removed_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_details_StudioEdit_removed_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_details_StudioEdit_removed_urls_site;
}

export interface SceneEdit_sceneEdit_details_StudioEdit_parent_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_details_StudioEdit_parent_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_details_StudioEdit_parent_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_details_StudioEdit_parent_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_details_StudioEdit_parent_urls_site;
}

export interface SceneEdit_sceneEdit_details_StudioEdit_parent_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface SceneEdit_sceneEdit_details_StudioEdit_parent {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: SceneEdit_sceneEdit_details_StudioEdit_parent_child_studios[];
  parent: SceneEdit_sceneEdit_details_StudioEdit_parent_parent | null;
  urls: SceneEdit_sceneEdit_details_StudioEdit_parent_urls[];
  images: SceneEdit_sceneEdit_details_StudioEdit_parent_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface SceneEdit_sceneEdit_details_StudioEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_details_StudioEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_details_StudioEdit {
  __typename: "StudioEdit";
  name: string | null;
  /**
   * Added and modified URLs
   */
  added_urls: SceneEdit_sceneEdit_details_StudioEdit_added_urls[] | null;
  removed_urls: SceneEdit_sceneEdit_details_StudioEdit_removed_urls[] | null;
  parent: SceneEdit_sceneEdit_details_StudioEdit_parent | null;
  added_images: SceneEdit_sceneEdit_details_StudioEdit_added_images[] | null;
  removed_images: SceneEdit_sceneEdit_details_StudioEdit_removed_images[] | null;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_added_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_added_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_details_SceneEdit_added_urls_site;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_removed_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_removed_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_details_SceneEdit_removed_urls_site;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_studio_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_studio_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_details_SceneEdit_studio_urls_site;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: SceneEdit_sceneEdit_details_SceneEdit_studio_child_studios[];
  parent: SceneEdit_sceneEdit_details_SceneEdit_studio_parent | null;
  urls: SceneEdit_sceneEdit_details_SceneEdit_studio_urls[];
  images: SceneEdit_sceneEdit_details_SceneEdit_studio_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer_urls_site;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer_birthdate | null;
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
  measurements: SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer_measurements;
  tattoos: SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer_tattoos[] | null;
  piercings: SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer_piercings[] | null;
  urls: SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer_urls[];
  images: SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer_images[];
  is_favorite: boolean;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_added_performers {
  __typename: "PerformerAppearance";
  performer: SceneEdit_sceneEdit_details_SceneEdit_added_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer_urls_site;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer_birthdate | null;
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
  measurements: SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer_measurements;
  tattoos: SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer_tattoos[] | null;
  piercings: SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer_piercings[] | null;
  urls: SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer_urls[];
  images: SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer_images[];
  is_favorite: boolean;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_removed_performers {
  __typename: "PerformerAppearance";
  performer: SceneEdit_sceneEdit_details_SceneEdit_removed_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_added_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_added_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: SceneEdit_sceneEdit_details_SceneEdit_added_tags_category | null;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_removed_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_removed_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: SceneEdit_sceneEdit_details_SceneEdit_removed_tags_category | null;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_details_SceneEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_details_SceneEdit {
  __typename: "SceneEdit";
  title: string | null;
  details: string | null;
  added_urls: SceneEdit_sceneEdit_details_SceneEdit_added_urls[] | null;
  removed_urls: SceneEdit_sceneEdit_details_SceneEdit_removed_urls[] | null;
  date: any | null;
  studio: SceneEdit_sceneEdit_details_SceneEdit_studio | null;
  /**
   * Added or modified performer appearance entries
   */
  added_performers: SceneEdit_sceneEdit_details_SceneEdit_added_performers[] | null;
  removed_performers: SceneEdit_sceneEdit_details_SceneEdit_removed_performers[] | null;
  added_tags: SceneEdit_sceneEdit_details_SceneEdit_added_tags[] | null;
  removed_tags: SceneEdit_sceneEdit_details_SceneEdit_removed_tags[] | null;
  added_images: SceneEdit_sceneEdit_details_SceneEdit_added_images[] | null;
  removed_images: SceneEdit_sceneEdit_details_SceneEdit_removed_images[] | null;
  duration: number | null;
  director: string | null;
}

export type SceneEdit_sceneEdit_details = SceneEdit_sceneEdit_details_TagEdit | SceneEdit_sceneEdit_details_PerformerEdit | SceneEdit_sceneEdit_details_StudioEdit | SceneEdit_sceneEdit_details_SceneEdit;

export interface SceneEdit_sceneEdit_old_details_TagEdit_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_old_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  category: SceneEdit_sceneEdit_old_details_TagEdit_category | null;
}

export interface SceneEdit_sceneEdit_old_details_PerformerEdit {
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

export interface SceneEdit_sceneEdit_old_details_StudioEdit_parent_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_old_details_StudioEdit_parent_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_old_details_StudioEdit_parent_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_old_details_StudioEdit_parent_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_old_details_StudioEdit_parent_urls_site;
}

export interface SceneEdit_sceneEdit_old_details_StudioEdit_parent_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface SceneEdit_sceneEdit_old_details_StudioEdit_parent {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: SceneEdit_sceneEdit_old_details_StudioEdit_parent_child_studios[];
  parent: SceneEdit_sceneEdit_old_details_StudioEdit_parent_parent | null;
  urls: SceneEdit_sceneEdit_old_details_StudioEdit_parent_urls[];
  images: SceneEdit_sceneEdit_old_details_StudioEdit_parent_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface SceneEdit_sceneEdit_old_details_StudioEdit {
  __typename: "StudioEdit";
  name: string | null;
  parent: SceneEdit_sceneEdit_old_details_StudioEdit_parent | null;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_added_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_added_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_old_details_SceneEdit_added_urls_site;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_removed_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_removed_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_old_details_SceneEdit_removed_urls_site;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_studio_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_studio_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_old_details_SceneEdit_studio_urls_site;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: SceneEdit_sceneEdit_old_details_SceneEdit_studio_child_studios[];
  parent: SceneEdit_sceneEdit_old_details_SceneEdit_studio_parent | null;
  urls: SceneEdit_sceneEdit_old_details_SceneEdit_studio_urls[];
  images: SceneEdit_sceneEdit_old_details_SceneEdit_studio_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer_urls_site;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer_birthdate | null;
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
  measurements: SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer_measurements;
  tattoos: SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer_tattoos[] | null;
  piercings: SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer_piercings[] | null;
  urls: SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer_urls[];
  images: SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer_images[];
  is_favorite: boolean;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_added_performers {
  __typename: "PerformerAppearance";
  performer: SceneEdit_sceneEdit_old_details_SceneEdit_added_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer_urls_site;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer_birthdate | null;
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
  measurements: SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer_measurements;
  tattoos: SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer_tattoos[] | null;
  piercings: SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer_piercings[] | null;
  urls: SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer_urls[];
  images: SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer_images[];
  is_favorite: boolean;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers {
  __typename: "PerformerAppearance";
  performer: SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_added_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_added_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: SceneEdit_sceneEdit_old_details_SceneEdit_added_tags_category | null;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_removed_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_removed_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: SceneEdit_sceneEdit_old_details_SceneEdit_removed_tags_category | null;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_old_details_SceneEdit {
  __typename: "SceneEdit";
  title: string | null;
  details: string | null;
  added_urls: SceneEdit_sceneEdit_old_details_SceneEdit_added_urls[] | null;
  removed_urls: SceneEdit_sceneEdit_old_details_SceneEdit_removed_urls[] | null;
  date: any | null;
  studio: SceneEdit_sceneEdit_old_details_SceneEdit_studio | null;
  /**
   * Added or modified performer appearance entries
   */
  added_performers: SceneEdit_sceneEdit_old_details_SceneEdit_added_performers[] | null;
  removed_performers: SceneEdit_sceneEdit_old_details_SceneEdit_removed_performers[] | null;
  added_tags: SceneEdit_sceneEdit_old_details_SceneEdit_added_tags[] | null;
  removed_tags: SceneEdit_sceneEdit_old_details_SceneEdit_removed_tags[] | null;
  added_images: SceneEdit_sceneEdit_old_details_SceneEdit_added_images[] | null;
  removed_images: SceneEdit_sceneEdit_old_details_SceneEdit_removed_images[] | null;
  duration: number | null;
  director: string | null;
}

export type SceneEdit_sceneEdit_old_details = SceneEdit_sceneEdit_old_details_TagEdit | SceneEdit_sceneEdit_old_details_PerformerEdit | SceneEdit_sceneEdit_old_details_StudioEdit | SceneEdit_sceneEdit_old_details_SceneEdit;

export interface SceneEdit_sceneEdit_merge_sources_Tag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: SceneEdit_sceneEdit_merge_sources_Tag_category | null;
}

export interface SceneEdit_sceneEdit_merge_sources_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface SceneEdit_sceneEdit_merge_sources_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface SceneEdit_sceneEdit_merge_sources_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_merge_sources_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_merge_sources_Performer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_merge_sources_Performer_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_merge_sources_Performer_urls_site;
}

export interface SceneEdit_sceneEdit_merge_sources_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_merge_sources_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: SceneEdit_sceneEdit_merge_sources_Performer_birthdate | null;
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
  measurements: SceneEdit_sceneEdit_merge_sources_Performer_measurements;
  tattoos: SceneEdit_sceneEdit_merge_sources_Performer_tattoos[] | null;
  piercings: SceneEdit_sceneEdit_merge_sources_Performer_piercings[] | null;
  urls: SceneEdit_sceneEdit_merge_sources_Performer_urls[];
  images: SceneEdit_sceneEdit_merge_sources_Performer_images[];
  is_favorite: boolean;
}

export interface SceneEdit_sceneEdit_merge_sources_Studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_merge_sources_Studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_merge_sources_Studio_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_merge_sources_Studio_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_merge_sources_Studio_urls_site;
}

export interface SceneEdit_sceneEdit_merge_sources_Studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface SceneEdit_sceneEdit_merge_sources_Studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: SceneEdit_sceneEdit_merge_sources_Studio_child_studios[];
  parent: SceneEdit_sceneEdit_merge_sources_Studio_parent | null;
  urls: SceneEdit_sceneEdit_merge_sources_Studio_urls[];
  images: SceneEdit_sceneEdit_merge_sources_Studio_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface SceneEdit_sceneEdit_merge_sources_Scene_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface SceneEdit_sceneEdit_merge_sources_Scene_urls {
  __typename: "URL";
  url: string;
  site: SceneEdit_sceneEdit_merge_sources_Scene_urls_site;
}

export interface SceneEdit_sceneEdit_merge_sources_Scene_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEdit_sceneEdit_merge_sources_Scene_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEdit_sceneEdit_merge_sources_Scene_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface SceneEdit_sceneEdit_merge_sources_Scene_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: SceneEdit_sceneEdit_merge_sources_Scene_performers_performer;
}

export interface SceneEdit_sceneEdit_merge_sources_Scene_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  user_submitted: boolean;
  created: any;
  updated: any;
}

export interface SceneEdit_sceneEdit_merge_sources_Scene_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface SceneEdit_sceneEdit_merge_sources_Scene {
  __typename: "Scene";
  id: string;
  date: any | null;
  title: string | null;
  deleted: boolean;
  details: string | null;
  director: string | null;
  duration: number | null;
  urls: SceneEdit_sceneEdit_merge_sources_Scene_urls[];
  images: SceneEdit_sceneEdit_merge_sources_Scene_images[];
  studio: SceneEdit_sceneEdit_merge_sources_Scene_studio | null;
  performers: SceneEdit_sceneEdit_merge_sources_Scene_performers[];
  fingerprints: SceneEdit_sceneEdit_merge_sources_Scene_fingerprints[];
  tags: SceneEdit_sceneEdit_merge_sources_Scene_tags[];
}

export type SceneEdit_sceneEdit_merge_sources = SceneEdit_sceneEdit_merge_sources_Tag | SceneEdit_sceneEdit_merge_sources_Performer | SceneEdit_sceneEdit_merge_sources_Studio | SceneEdit_sceneEdit_merge_sources_Scene;

export interface SceneEdit_sceneEdit_options {
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

export interface SceneEdit_sceneEdit {
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
  /**
   * Is the edit considered destructive.
   */
  destructive: boolean;
  comments: SceneEdit_sceneEdit_comments[];
  votes: SceneEdit_sceneEdit_votes[];
  user: SceneEdit_sceneEdit_user | null;
  /**
   * Object being edited - null if creating a new object
   */
  target: SceneEdit_sceneEdit_target | null;
  details: SceneEdit_sceneEdit_details | null;
  /**
   * Previous state of fields being modified - null if operation is create or delete.
   */
  old_details: SceneEdit_sceneEdit_old_details | null;
  /**
   * Objects to merge with the target. Only applicable to merges
   */
  merge_sources: SceneEdit_sceneEdit_merge_sources[];
  /**
   * Entity specific options
   */
  options: SceneEdit_sceneEdit_options | null;
}

export interface SceneEdit {
  /**
   * Propose a new scene or modification to a scene
   */
  sceneEdit: SceneEdit_sceneEdit;
}

export interface SceneEditVariables {
  sceneData: SceneEditInput;
}
