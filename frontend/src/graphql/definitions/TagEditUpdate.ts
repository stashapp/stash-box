/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TagEditInput, TargetTypeEnum, OperationEnum, VoteStatusEnum, VoteTypeEnum, GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: TagEditUpdate
// ====================================================

export interface TagEditUpdate_tagEditUpdate_comments_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_comments {
  __typename: "EditComment";
  id: string;
  user: TagEditUpdate_tagEditUpdate_comments_user | null;
  date: any;
  comment: string;
}

export interface TagEditUpdate_tagEditUpdate_votes_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_votes {
  __typename: "EditVote";
  user: TagEditUpdate_tagEditUpdate_votes_user | null;
  date: any;
  vote: VoteTypeEnum;
}

export interface TagEditUpdate_tagEditUpdate_user {
  __typename: "User";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_target_Tag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_target_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: TagEditUpdate_tagEditUpdate_target_Tag_category | null;
}

export interface TagEditUpdate_tagEditUpdate_target_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface TagEditUpdate_tagEditUpdate_target_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface TagEditUpdate_tagEditUpdate_target_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_target_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_target_Performer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_target_Performer_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_target_Performer_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_target_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_target_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: TagEditUpdate_tagEditUpdate_target_Performer_birthdate | null;
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
  measurements: TagEditUpdate_tagEditUpdate_target_Performer_measurements;
  tattoos: TagEditUpdate_tagEditUpdate_target_Performer_tattoos[] | null;
  piercings: TagEditUpdate_tagEditUpdate_target_Performer_piercings[] | null;
  urls: TagEditUpdate_tagEditUpdate_target_Performer_urls[];
  images: TagEditUpdate_tagEditUpdate_target_Performer_images[];
  is_favorite: boolean;
}

export interface TagEditUpdate_tagEditUpdate_target_Studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_target_Studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_target_Studio_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_target_Studio_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_target_Studio_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_target_Studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface TagEditUpdate_tagEditUpdate_target_Studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: TagEditUpdate_tagEditUpdate_target_Studio_child_studios[];
  parent: TagEditUpdate_tagEditUpdate_target_Studio_parent | null;
  urls: TagEditUpdate_tagEditUpdate_target_Studio_urls[];
  images: TagEditUpdate_tagEditUpdate_target_Studio_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface TagEditUpdate_tagEditUpdate_target_Scene_date {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface TagEditUpdate_tagEditUpdate_target_Scene_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_target_Scene_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_target_Scene_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_target_Scene_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_target_Scene_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_target_Scene_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface TagEditUpdate_tagEditUpdate_target_Scene_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: TagEditUpdate_tagEditUpdate_target_Scene_performers_performer;
}

export interface TagEditUpdate_tagEditUpdate_target_Scene_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  user_submitted: boolean;
  created: any;
  updated: any;
}

export interface TagEditUpdate_tagEditUpdate_target_Scene_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_target_Scene {
  __typename: "Scene";
  id: string;
  date: TagEditUpdate_tagEditUpdate_target_Scene_date | null;
  title: string | null;
  deleted: boolean;
  details: string | null;
  director: string | null;
  code: string | null;
  duration: number | null;
  urls: TagEditUpdate_tagEditUpdate_target_Scene_urls[];
  images: TagEditUpdate_tagEditUpdate_target_Scene_images[];
  studio: TagEditUpdate_tagEditUpdate_target_Scene_studio | null;
  performers: TagEditUpdate_tagEditUpdate_target_Scene_performers[];
  fingerprints: TagEditUpdate_tagEditUpdate_target_Scene_fingerprints[];
  tags: TagEditUpdate_tagEditUpdate_target_Scene_tags[];
}

export type TagEditUpdate_tagEditUpdate_target = TagEditUpdate_tagEditUpdate_target_Tag | TagEditUpdate_tagEditUpdate_target_Performer | TagEditUpdate_tagEditUpdate_target_Studio | TagEditUpdate_tagEditUpdate_target_Scene;

export interface TagEditUpdate_tagEditUpdate_details_TagEdit_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  category: TagEditUpdate_tagEditUpdate_details_TagEdit_category | null;
}

export interface TagEditUpdate_tagEditUpdate_details_PerformerEdit_added_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_details_PerformerEdit_added_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_details_PerformerEdit_added_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_details_PerformerEdit_removed_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_details_PerformerEdit_removed_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_details_PerformerEdit_removed_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_details_PerformerEdit_added_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_details_PerformerEdit_removed_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_details_PerformerEdit_added_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_details_PerformerEdit_removed_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_details_PerformerEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_details_PerformerEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_details_PerformerEdit {
  __typename: "PerformerEdit";
  name: string | null;
  disambiguation: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  gender: GenderEnum | null;
  added_urls: TagEditUpdate_tagEditUpdate_details_PerformerEdit_added_urls[] | null;
  removed_urls: TagEditUpdate_tagEditUpdate_details_PerformerEdit_removed_urls[] | null;
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
  added_tattoos: TagEditUpdate_tagEditUpdate_details_PerformerEdit_added_tattoos[] | null;
  removed_tattoos: TagEditUpdate_tagEditUpdate_details_PerformerEdit_removed_tattoos[] | null;
  added_piercings: TagEditUpdate_tagEditUpdate_details_PerformerEdit_added_piercings[] | null;
  removed_piercings: TagEditUpdate_tagEditUpdate_details_PerformerEdit_removed_piercings[] | null;
  added_images: (TagEditUpdate_tagEditUpdate_details_PerformerEdit_added_images | null)[] | null;
  removed_images: (TagEditUpdate_tagEditUpdate_details_PerformerEdit_removed_images | null)[] | null;
  draft_id: string | null;
}

export interface TagEditUpdate_tagEditUpdate_details_StudioEdit_added_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_details_StudioEdit_added_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_details_StudioEdit_added_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_details_StudioEdit_removed_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_details_StudioEdit_removed_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_details_StudioEdit_removed_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_details_StudioEdit_parent_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_details_StudioEdit_parent_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_details_StudioEdit_parent_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_details_StudioEdit_parent_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_details_StudioEdit_parent_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_details_StudioEdit_parent_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface TagEditUpdate_tagEditUpdate_details_StudioEdit_parent {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: TagEditUpdate_tagEditUpdate_details_StudioEdit_parent_child_studios[];
  parent: TagEditUpdate_tagEditUpdate_details_StudioEdit_parent_parent | null;
  urls: TagEditUpdate_tagEditUpdate_details_StudioEdit_parent_urls[];
  images: TagEditUpdate_tagEditUpdate_details_StudioEdit_parent_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface TagEditUpdate_tagEditUpdate_details_StudioEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_details_StudioEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_details_StudioEdit {
  __typename: "StudioEdit";
  name: string | null;
  /**
   * Added and modified URLs
   */
  added_urls: TagEditUpdate_tagEditUpdate_details_StudioEdit_added_urls[] | null;
  removed_urls: TagEditUpdate_tagEditUpdate_details_StudioEdit_removed_urls[] | null;
  parent: TagEditUpdate_tagEditUpdate_details_StudioEdit_parent | null;
  added_images: (TagEditUpdate_tagEditUpdate_details_StudioEdit_added_images | null)[] | null;
  removed_images: (TagEditUpdate_tagEditUpdate_details_StudioEdit_removed_images | null)[] | null;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_added_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_added_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_details_SceneEdit_added_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_studio_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_studio_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_details_SceneEdit_studio_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: TagEditUpdate_tagEditUpdate_details_SceneEdit_studio_child_studios[];
  parent: TagEditUpdate_tagEditUpdate_details_SceneEdit_studio_parent | null;
  urls: TagEditUpdate_tagEditUpdate_details_SceneEdit_studio_urls[];
  images: TagEditUpdate_tagEditUpdate_details_SceneEdit_studio_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer_birthdate | null;
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
  measurements: TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer_measurements;
  tattoos: TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer_tattoos[] | null;
  piercings: TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer_piercings[] | null;
  urls: TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer_urls[];
  images: TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer_images[];
  is_favorite: boolean;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers {
  __typename: "PerformerAppearance";
  performer: TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer_birthdate | null;
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
  measurements: TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer_measurements;
  tattoos: TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer_tattoos[] | null;
  piercings: TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer_piercings[] | null;
  urls: TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer_urls[];
  images: TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer_images[];
  is_favorite: boolean;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers {
  __typename: "PerformerAppearance";
  performer: TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_added_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_added_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: TagEditUpdate_tagEditUpdate_details_SceneEdit_added_tags_category | null;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_tags_category | null;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_added_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
}

export interface TagEditUpdate_tagEditUpdate_details_SceneEdit {
  __typename: "SceneEdit";
  title: string | null;
  details: string | null;
  added_urls: TagEditUpdate_tagEditUpdate_details_SceneEdit_added_urls[] | null;
  removed_urls: TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_urls[] | null;
  date: string | null;
  date_accuracy: string | null;
  studio: TagEditUpdate_tagEditUpdate_details_SceneEdit_studio | null;
  /**
   * Added or modified performer appearance entries
   */
  added_performers: TagEditUpdate_tagEditUpdate_details_SceneEdit_added_performers[] | null;
  removed_performers: TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_performers[] | null;
  added_tags: TagEditUpdate_tagEditUpdate_details_SceneEdit_added_tags[] | null;
  removed_tags: TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_tags[] | null;
  added_images: (TagEditUpdate_tagEditUpdate_details_SceneEdit_added_images | null)[] | null;
  removed_images: (TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_images | null)[] | null;
  added_fingerprints: TagEditUpdate_tagEditUpdate_details_SceneEdit_added_fingerprints[] | null;
  removed_fingerprints: TagEditUpdate_tagEditUpdate_details_SceneEdit_removed_fingerprints[] | null;
  duration: number | null;
  director: string | null;
  code: string | null;
  draft_id: string | null;
}

export type TagEditUpdate_tagEditUpdate_details = TagEditUpdate_tagEditUpdate_details_TagEdit | TagEditUpdate_tagEditUpdate_details_PerformerEdit | TagEditUpdate_tagEditUpdate_details_StudioEdit | TagEditUpdate_tagEditUpdate_details_SceneEdit;

export interface TagEditUpdate_tagEditUpdate_old_details_TagEdit_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_old_details_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  category: TagEditUpdate_tagEditUpdate_old_details_TagEdit_category | null;
}

export interface TagEditUpdate_tagEditUpdate_old_details_PerformerEdit {
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

export interface TagEditUpdate_tagEditUpdate_old_details_StudioEdit_parent_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_old_details_StudioEdit_parent_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_old_details_StudioEdit_parent_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_old_details_StudioEdit_parent_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_old_details_StudioEdit_parent_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_old_details_StudioEdit_parent_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface TagEditUpdate_tagEditUpdate_old_details_StudioEdit_parent {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: TagEditUpdate_tagEditUpdate_old_details_StudioEdit_parent_child_studios[];
  parent: TagEditUpdate_tagEditUpdate_old_details_StudioEdit_parent_parent | null;
  urls: TagEditUpdate_tagEditUpdate_old_details_StudioEdit_parent_urls[];
  images: TagEditUpdate_tagEditUpdate_old_details_StudioEdit_parent_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface TagEditUpdate_tagEditUpdate_old_details_StudioEdit {
  __typename: "StudioEdit";
  name: string | null;
  parent: TagEditUpdate_tagEditUpdate_old_details_StudioEdit_parent | null;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_studio_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_studio_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_studio_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_studio_child_studios[];
  parent: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_studio_parent | null;
  urls: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_studio_urls[];
  images: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_studio_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer_birthdate | null;
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
  measurements: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer_measurements;
  tattoos: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer_tattoos[] | null;
  piercings: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer_piercings[] | null;
  urls: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer_urls[];
  images: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer_images[];
  is_favorite: boolean;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers {
  __typename: "PerformerAppearance";
  performer: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer_birthdate | null;
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
  measurements: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer_measurements;
  tattoos: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer_tattoos[] | null;
  piercings: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer_piercings[] | null;
  urls: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer_urls[];
  images: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer_images[];
  is_favorite: boolean;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers {
  __typename: "PerformerAppearance";
  performer: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_tags_category | null;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_tags_category | null;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
}

export interface TagEditUpdate_tagEditUpdate_old_details_SceneEdit {
  __typename: "SceneEdit";
  title: string | null;
  details: string | null;
  added_urls: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_urls[] | null;
  removed_urls: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_urls[] | null;
  date: string | null;
  date_accuracy: string | null;
  studio: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_studio | null;
  /**
   * Added or modified performer appearance entries
   */
  added_performers: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_performers[] | null;
  removed_performers: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_performers[] | null;
  added_tags: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_tags[] | null;
  removed_tags: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_tags[] | null;
  added_images: (TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_images | null)[] | null;
  removed_images: (TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_images | null)[] | null;
  added_fingerprints: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_added_fingerprints[] | null;
  removed_fingerprints: TagEditUpdate_tagEditUpdate_old_details_SceneEdit_removed_fingerprints[] | null;
  duration: number | null;
  director: string | null;
  code: string | null;
}

export type TagEditUpdate_tagEditUpdate_old_details = TagEditUpdate_tagEditUpdate_old_details_TagEdit | TagEditUpdate_tagEditUpdate_old_details_PerformerEdit | TagEditUpdate_tagEditUpdate_old_details_StudioEdit | TagEditUpdate_tagEditUpdate_old_details_SceneEdit;

export interface TagEditUpdate_tagEditUpdate_merge_sources_Tag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: TagEditUpdate_tagEditUpdate_merge_sources_Tag_category | null;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Performer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Performer_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_merge_sources_Performer_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: TagEditUpdate_tagEditUpdate_merge_sources_Performer_birthdate | null;
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
  measurements: TagEditUpdate_tagEditUpdate_merge_sources_Performer_measurements;
  tattoos: TagEditUpdate_tagEditUpdate_merge_sources_Performer_tattoos[] | null;
  piercings: TagEditUpdate_tagEditUpdate_merge_sources_Performer_piercings[] | null;
  urls: TagEditUpdate_tagEditUpdate_merge_sources_Performer_urls[];
  images: TagEditUpdate_tagEditUpdate_merge_sources_Performer_images[];
  is_favorite: boolean;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Studio_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Studio_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_merge_sources_Studio_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: TagEditUpdate_tagEditUpdate_merge_sources_Studio_child_studios[];
  parent: TagEditUpdate_tagEditUpdate_merge_sources_Studio_parent | null;
  urls: TagEditUpdate_tagEditUpdate_merge_sources_Studio_urls[];
  images: TagEditUpdate_tagEditUpdate_merge_sources_Studio_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Scene_date {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Scene_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Scene_urls {
  __typename: "URL";
  url: string;
  site: TagEditUpdate_tagEditUpdate_merge_sources_Scene_urls_site;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Scene_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Scene_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Scene_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Scene_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: TagEditUpdate_tagEditUpdate_merge_sources_Scene_performers_performer;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Scene_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  user_submitted: boolean;
  created: any;
  updated: any;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Scene_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface TagEditUpdate_tagEditUpdate_merge_sources_Scene {
  __typename: "Scene";
  id: string;
  date: TagEditUpdate_tagEditUpdate_merge_sources_Scene_date | null;
  title: string | null;
  deleted: boolean;
  details: string | null;
  director: string | null;
  code: string | null;
  duration: number | null;
  urls: TagEditUpdate_tagEditUpdate_merge_sources_Scene_urls[];
  images: TagEditUpdate_tagEditUpdate_merge_sources_Scene_images[];
  studio: TagEditUpdate_tagEditUpdate_merge_sources_Scene_studio | null;
  performers: TagEditUpdate_tagEditUpdate_merge_sources_Scene_performers[];
  fingerprints: TagEditUpdate_tagEditUpdate_merge_sources_Scene_fingerprints[];
  tags: TagEditUpdate_tagEditUpdate_merge_sources_Scene_tags[];
}

export type TagEditUpdate_tagEditUpdate_merge_sources = TagEditUpdate_tagEditUpdate_merge_sources_Tag | TagEditUpdate_tagEditUpdate_merge_sources_Performer | TagEditUpdate_tagEditUpdate_merge_sources_Studio | TagEditUpdate_tagEditUpdate_merge_sources_Scene;

export interface TagEditUpdate_tagEditUpdate_options {
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

export interface TagEditUpdate_tagEditUpdate {
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
  comments: TagEditUpdate_tagEditUpdate_comments[];
  votes: TagEditUpdate_tagEditUpdate_votes[];
  user: TagEditUpdate_tagEditUpdate_user | null;
  /**
   * Object being edited - null if creating a new object
   */
  target: TagEditUpdate_tagEditUpdate_target | null;
  details: TagEditUpdate_tagEditUpdate_details | null;
  /**
   * Previous state of fields being modified - null if operation is create or delete.
   */
  old_details: TagEditUpdate_tagEditUpdate_old_details | null;
  /**
   * Objects to merge with the target. Only applicable to merges
   */
  merge_sources: TagEditUpdate_tagEditUpdate_merge_sources[];
  /**
   * Entity specific options
   */
  options: TagEditUpdate_tagEditUpdate_options | null;
}

export interface TagEditUpdate {
  /**
   * Update a pending tag edit
   */
  tagEditUpdate: TagEditUpdate_tagEditUpdate;
}

export interface TagEditUpdateVariables {
  id: string;
  tagData: TagEditInput;
}
