/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TargetTypeEnum, OperationEnum, VoteStatusEnum, GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL query operation: EditUpdate
// ====================================================

export interface EditUpdate_findEdit_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface EditUpdate_findEdit_target_Tag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface EditUpdate_findEdit_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: EditUpdate_findEdit_target_Tag_category | null;
}

export interface EditUpdate_findEdit_target_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface EditUpdate_findEdit_target_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface EditUpdate_findEdit_target_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditUpdate_findEdit_target_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditUpdate_findEdit_target_Performer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface EditUpdate_findEdit_target_Performer_urls {
  __typename: "URL";
  url: string;
  site: EditUpdate_findEdit_target_Performer_urls_site;
}

export interface EditUpdate_findEdit_target_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditUpdate_findEdit_target_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: EditUpdate_findEdit_target_Performer_birthdate | null;
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
  measurements: EditUpdate_findEdit_target_Performer_measurements;
  tattoos: EditUpdate_findEdit_target_Performer_tattoos[] | null;
  piercings: EditUpdate_findEdit_target_Performer_piercings[] | null;
  urls: EditUpdate_findEdit_target_Performer_urls[];
  images: EditUpdate_findEdit_target_Performer_images[];
  is_favorite: boolean;
}

export interface EditUpdate_findEdit_target_Studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditUpdate_findEdit_target_Studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditUpdate_findEdit_target_Studio_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface EditUpdate_findEdit_target_Studio_urls {
  __typename: "URL";
  url: string;
  site: EditUpdate_findEdit_target_Studio_urls_site;
}

export interface EditUpdate_findEdit_target_Studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface EditUpdate_findEdit_target_Studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: EditUpdate_findEdit_target_Studio_child_studios[];
  parent: EditUpdate_findEdit_target_Studio_parent | null;
  urls: EditUpdate_findEdit_target_Studio_urls[];
  images: EditUpdate_findEdit_target_Studio_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface EditUpdate_findEdit_target_Scene_date {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface EditUpdate_findEdit_target_Scene_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface EditUpdate_findEdit_target_Scene_urls {
  __typename: "URL";
  url: string;
  site: EditUpdate_findEdit_target_Scene_urls_site;
}

export interface EditUpdate_findEdit_target_Scene_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditUpdate_findEdit_target_Scene_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditUpdate_findEdit_target_Scene_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface EditUpdate_findEdit_target_Scene_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: EditUpdate_findEdit_target_Scene_performers_performer;
}

export interface EditUpdate_findEdit_target_Scene_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  user_submitted: boolean;
  created: any;
  updated: any;
}

export interface EditUpdate_findEdit_target_Scene_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface EditUpdate_findEdit_target_Scene {
  __typename: "Scene";
  id: string;
  date: EditUpdate_findEdit_target_Scene_date | null;
  title: string | null;
  deleted: boolean;
  details: string | null;
  director: string | null;
  code: string | null;
  duration: number | null;
  urls: EditUpdate_findEdit_target_Scene_urls[];
  images: EditUpdate_findEdit_target_Scene_images[];
  studio: EditUpdate_findEdit_target_Scene_studio | null;
  performers: EditUpdate_findEdit_target_Scene_performers[];
  fingerprints: EditUpdate_findEdit_target_Scene_fingerprints[];
  tags: EditUpdate_findEdit_target_Scene_tags[];
}

export type EditUpdate_findEdit_target = EditUpdate_findEdit_target_Tag | EditUpdate_findEdit_target_Performer | EditUpdate_findEdit_target_Studio | EditUpdate_findEdit_target_Scene;

export interface EditUpdate_findEdit_details_TagEdit_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface EditUpdate_findEdit_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  category: EditUpdate_findEdit_details_TagEdit_category | null;
}

export interface EditUpdate_findEdit_details_PerformerEdit_added_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface EditUpdate_findEdit_details_PerformerEdit_added_urls {
  __typename: "URL";
  url: string;
  site: EditUpdate_findEdit_details_PerformerEdit_added_urls_site;
}

export interface EditUpdate_findEdit_details_PerformerEdit_removed_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface EditUpdate_findEdit_details_PerformerEdit_removed_urls {
  __typename: "URL";
  url: string;
  site: EditUpdate_findEdit_details_PerformerEdit_removed_urls_site;
}

export interface EditUpdate_findEdit_details_PerformerEdit_added_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditUpdate_findEdit_details_PerformerEdit_removed_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditUpdate_findEdit_details_PerformerEdit_added_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditUpdate_findEdit_details_PerformerEdit_removed_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditUpdate_findEdit_details_PerformerEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditUpdate_findEdit_details_PerformerEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditUpdate_findEdit_details_PerformerEdit {
  __typename: "PerformerEdit";
  name: string | null;
  disambiguation: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  gender: GenderEnum | null;
  added_urls: EditUpdate_findEdit_details_PerformerEdit_added_urls[] | null;
  removed_urls: EditUpdate_findEdit_details_PerformerEdit_removed_urls[] | null;
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
  added_tattoos: EditUpdate_findEdit_details_PerformerEdit_added_tattoos[] | null;
  removed_tattoos: EditUpdate_findEdit_details_PerformerEdit_removed_tattoos[] | null;
  added_piercings: EditUpdate_findEdit_details_PerformerEdit_added_piercings[] | null;
  removed_piercings: EditUpdate_findEdit_details_PerformerEdit_removed_piercings[] | null;
  added_images: (EditUpdate_findEdit_details_PerformerEdit_added_images | null)[] | null;
  removed_images: (EditUpdate_findEdit_details_PerformerEdit_removed_images | null)[] | null;
  draft_id: string | null;
}

export interface EditUpdate_findEdit_details_StudioEdit_added_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface EditUpdate_findEdit_details_StudioEdit_added_urls {
  __typename: "URL";
  url: string;
  site: EditUpdate_findEdit_details_StudioEdit_added_urls_site;
}

export interface EditUpdate_findEdit_details_StudioEdit_removed_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface EditUpdate_findEdit_details_StudioEdit_removed_urls {
  __typename: "URL";
  url: string;
  site: EditUpdate_findEdit_details_StudioEdit_removed_urls_site;
}

export interface EditUpdate_findEdit_details_StudioEdit_parent_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditUpdate_findEdit_details_StudioEdit_parent_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditUpdate_findEdit_details_StudioEdit_parent_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface EditUpdate_findEdit_details_StudioEdit_parent_urls {
  __typename: "URL";
  url: string;
  site: EditUpdate_findEdit_details_StudioEdit_parent_urls_site;
}

export interface EditUpdate_findEdit_details_StudioEdit_parent_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface EditUpdate_findEdit_details_StudioEdit_parent {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: EditUpdate_findEdit_details_StudioEdit_parent_child_studios[];
  parent: EditUpdate_findEdit_details_StudioEdit_parent_parent | null;
  urls: EditUpdate_findEdit_details_StudioEdit_parent_urls[];
  images: EditUpdate_findEdit_details_StudioEdit_parent_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface EditUpdate_findEdit_details_StudioEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditUpdate_findEdit_details_StudioEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditUpdate_findEdit_details_StudioEdit {
  __typename: "StudioEdit";
  name: string | null;
  /**
   * Added and modified URLs
   */
  added_urls: EditUpdate_findEdit_details_StudioEdit_added_urls[] | null;
  removed_urls: EditUpdate_findEdit_details_StudioEdit_removed_urls[] | null;
  parent: EditUpdate_findEdit_details_StudioEdit_parent | null;
  added_images: (EditUpdate_findEdit_details_StudioEdit_added_images | null)[] | null;
  removed_images: (EditUpdate_findEdit_details_StudioEdit_removed_images | null)[] | null;
}

export interface EditUpdate_findEdit_details_SceneEdit_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface EditUpdate_findEdit_details_SceneEdit_urls {
  __typename: "URL";
  url: string;
  site: EditUpdate_findEdit_details_SceneEdit_urls_site;
}

export interface EditUpdate_findEdit_details_SceneEdit_studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditUpdate_findEdit_details_SceneEdit_studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditUpdate_findEdit_details_SceneEdit_studio_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface EditUpdate_findEdit_details_SceneEdit_studio_urls {
  __typename: "URL";
  url: string;
  site: EditUpdate_findEdit_details_SceneEdit_studio_urls_site;
}

export interface EditUpdate_findEdit_details_SceneEdit_studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface EditUpdate_findEdit_details_SceneEdit_studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: EditUpdate_findEdit_details_SceneEdit_studio_child_studios[];
  parent: EditUpdate_findEdit_details_SceneEdit_studio_parent | null;
  urls: EditUpdate_findEdit_details_SceneEdit_studio_urls[];
  images: EditUpdate_findEdit_details_SceneEdit_studio_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface EditUpdate_findEdit_details_SceneEdit_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface EditUpdate_findEdit_details_SceneEdit_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface EditUpdate_findEdit_details_SceneEdit_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditUpdate_findEdit_details_SceneEdit_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditUpdate_findEdit_details_SceneEdit_performers_performer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface EditUpdate_findEdit_details_SceneEdit_performers_performer_urls {
  __typename: "URL";
  url: string;
  site: EditUpdate_findEdit_details_SceneEdit_performers_performer_urls_site;
}

export interface EditUpdate_findEdit_details_SceneEdit_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditUpdate_findEdit_details_SceneEdit_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: EditUpdate_findEdit_details_SceneEdit_performers_performer_birthdate | null;
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
  measurements: EditUpdate_findEdit_details_SceneEdit_performers_performer_measurements;
  tattoos: EditUpdate_findEdit_details_SceneEdit_performers_performer_tattoos[] | null;
  piercings: EditUpdate_findEdit_details_SceneEdit_performers_performer_piercings[] | null;
  urls: EditUpdate_findEdit_details_SceneEdit_performers_performer_urls[];
  images: EditUpdate_findEdit_details_SceneEdit_performers_performer_images[];
  is_favorite: boolean;
}

export interface EditUpdate_findEdit_details_SceneEdit_performers {
  __typename: "PerformerAppearance";
  performer: EditUpdate_findEdit_details_SceneEdit_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface EditUpdate_findEdit_details_SceneEdit_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface EditUpdate_findEdit_details_SceneEdit_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: EditUpdate_findEdit_details_SceneEdit_tags_category | null;
}

export interface EditUpdate_findEdit_details_SceneEdit_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditUpdate_findEdit_details_SceneEdit_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
}

export interface EditUpdate_findEdit_details_SceneEdit {
  __typename: "SceneEdit";
  title: string | null;
  details: string | null;
  urls: EditUpdate_findEdit_details_SceneEdit_urls[];
  date: string | null;
  date_accuracy: string | null;
  studio: EditUpdate_findEdit_details_SceneEdit_studio | null;
  performers: EditUpdate_findEdit_details_SceneEdit_performers[];
  tags: EditUpdate_findEdit_details_SceneEdit_tags[];
  images: EditUpdate_findEdit_details_SceneEdit_images[];
  fingerprints: EditUpdate_findEdit_details_SceneEdit_fingerprints[];
  duration: number | null;
  director: string | null;
  code: string | null;
  draft_id: string | null;
}

export type EditUpdate_findEdit_details = EditUpdate_findEdit_details_TagEdit | EditUpdate_findEdit_details_PerformerEdit | EditUpdate_findEdit_details_StudioEdit | EditUpdate_findEdit_details_SceneEdit;

export interface EditUpdate_findEdit {
  __typename: "Edit";
  id: string;
  target_type: TargetTypeEnum;
  operation: OperationEnum;
  status: VoteStatusEnum;
  applied: boolean;
  created: any;
  updated: any | null;
  /**
   *  = Accepted - Rejected
   */
  vote_count: number;
  /**
   * Is the edit considered destructive.
   */
  destructive: boolean;
  user: EditUpdate_findEdit_user | null;
  /**
   * Object being edited - null if creating a new object
   */
  target: EditUpdate_findEdit_target | null;
  details: EditUpdate_findEdit_details | null;
}

export interface EditUpdate {
  findEdit: EditUpdate_findEdit | null;
}

export interface EditUpdateVariables {
  id: string;
}
