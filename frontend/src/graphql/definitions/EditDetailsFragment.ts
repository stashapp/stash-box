/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, EthnicityEnum, EyeColorEnum, HairColorEnum, BreastTypeEnum, DateAccuracyEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL fragment: EditDetailsFragment
// ====================================================

export interface EditDetailsFragment_TagEdit {
  __typename: "TagEdit";
  name: string | null;
  description: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  category_id: string | null;
}

export interface EditDetailsFragment_PerformerEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditDetailsFragment_PerformerEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditDetailsFragment_PerformerEdit_added_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditDetailsFragment_PerformerEdit_removed_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditDetailsFragment_PerformerEdit_added_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditDetailsFragment_PerformerEdit_removed_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditDetailsFragment_PerformerEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditDetailsFragment_PerformerEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditDetailsFragment_PerformerEdit {
  __typename: "PerformerEdit";
  name: string | null;
  disambiguation: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  gender: GenderEnum | null;
  added_urls: EditDetailsFragment_PerformerEdit_added_urls[] | null;
  removed_urls: EditDetailsFragment_PerformerEdit_removed_urls[] | null;
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
  added_tattoos: EditDetailsFragment_PerformerEdit_added_tattoos[] | null;
  removed_tattoos: EditDetailsFragment_PerformerEdit_removed_tattoos[] | null;
  added_piercings: EditDetailsFragment_PerformerEdit_added_piercings[] | null;
  removed_piercings: EditDetailsFragment_PerformerEdit_removed_piercings[] | null;
  added_images: (EditDetailsFragment_PerformerEdit_added_images | null)[] | null;
  removed_images: (EditDetailsFragment_PerformerEdit_removed_images | null)[] | null;
}

export interface EditDetailsFragment_StudioEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditDetailsFragment_StudioEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditDetailsFragment_StudioEdit_parent_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditDetailsFragment_StudioEdit_parent_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditDetailsFragment_StudioEdit_parent_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditDetailsFragment_StudioEdit_parent_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface EditDetailsFragment_StudioEdit_parent {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: EditDetailsFragment_StudioEdit_parent_child_studios[];
  parent: EditDetailsFragment_StudioEdit_parent_parent | null;
  urls: EditDetailsFragment_StudioEdit_parent_urls[];
  images: EditDetailsFragment_StudioEdit_parent_images[];
  deleted: boolean;
}

export interface EditDetailsFragment_StudioEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditDetailsFragment_StudioEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditDetailsFragment_StudioEdit {
  __typename: "StudioEdit";
  name: string | null;
  /**
   * Added and modified URLs
   */
  added_urls: EditDetailsFragment_StudioEdit_added_urls[] | null;
  removed_urls: EditDetailsFragment_StudioEdit_removed_urls[] | null;
  parent: EditDetailsFragment_StudioEdit_parent | null;
  added_images: (EditDetailsFragment_StudioEdit_added_images | null)[] | null;
  removed_images: (EditDetailsFragment_StudioEdit_removed_images | null)[] | null;
}

export interface EditDetailsFragment_SceneEdit_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditDetailsFragment_SceneEdit_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditDetailsFragment_SceneEdit_studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditDetailsFragment_SceneEdit_studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditDetailsFragment_SceneEdit_studio_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditDetailsFragment_SceneEdit_studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface EditDetailsFragment_SceneEdit_studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: EditDetailsFragment_SceneEdit_studio_child_studios[];
  parent: EditDetailsFragment_SceneEdit_studio_parent | null;
  urls: EditDetailsFragment_SceneEdit_studio_urls[];
  images: EditDetailsFragment_SceneEdit_studio_images[];
  deleted: boolean;
}

export interface EditDetailsFragment_SceneEdit_added_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface EditDetailsFragment_SceneEdit_added_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface EditDetailsFragment_SceneEdit_added_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditDetailsFragment_SceneEdit_added_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditDetailsFragment_SceneEdit_added_performers_performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditDetailsFragment_SceneEdit_added_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditDetailsFragment_SceneEdit_added_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: EditDetailsFragment_SceneEdit_added_performers_performer_birthdate | null;
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
  measurements: EditDetailsFragment_SceneEdit_added_performers_performer_measurements;
  tattoos: EditDetailsFragment_SceneEdit_added_performers_performer_tattoos[] | null;
  piercings: EditDetailsFragment_SceneEdit_added_performers_performer_piercings[] | null;
  urls: EditDetailsFragment_SceneEdit_added_performers_performer_urls[];
  images: EditDetailsFragment_SceneEdit_added_performers_performer_images[];
}

export interface EditDetailsFragment_SceneEdit_added_performers {
  __typename: "PerformerAppearance";
  performer: EditDetailsFragment_SceneEdit_added_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface EditDetailsFragment_SceneEdit_removed_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface EditDetailsFragment_SceneEdit_removed_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface EditDetailsFragment_SceneEdit_removed_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditDetailsFragment_SceneEdit_removed_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditDetailsFragment_SceneEdit_removed_performers_performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditDetailsFragment_SceneEdit_removed_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditDetailsFragment_SceneEdit_removed_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: EditDetailsFragment_SceneEdit_removed_performers_performer_birthdate | null;
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
  measurements: EditDetailsFragment_SceneEdit_removed_performers_performer_measurements;
  tattoos: EditDetailsFragment_SceneEdit_removed_performers_performer_tattoos[] | null;
  piercings: EditDetailsFragment_SceneEdit_removed_performers_performer_piercings[] | null;
  urls: EditDetailsFragment_SceneEdit_removed_performers_performer_urls[];
  images: EditDetailsFragment_SceneEdit_removed_performers_performer_images[];
}

export interface EditDetailsFragment_SceneEdit_removed_performers {
  __typename: "PerformerAppearance";
  performer: EditDetailsFragment_SceneEdit_removed_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface EditDetailsFragment_SceneEdit_added_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface EditDetailsFragment_SceneEdit_added_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: EditDetailsFragment_SceneEdit_added_tags_category | null;
}

export interface EditDetailsFragment_SceneEdit_removed_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface EditDetailsFragment_SceneEdit_removed_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: EditDetailsFragment_SceneEdit_removed_tags_category | null;
}

export interface EditDetailsFragment_SceneEdit_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditDetailsFragment_SceneEdit_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditDetailsFragment_SceneEdit_added_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  created: any;
  updated: any;
}

export interface EditDetailsFragment_SceneEdit_removed_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  created: any;
  updated: any;
}

export interface EditDetailsFragment_SceneEdit {
  __typename: "SceneEdit";
  title: string | null;
  details: string | null;
  added_urls: EditDetailsFragment_SceneEdit_added_urls[] | null;
  removed_urls: EditDetailsFragment_SceneEdit_removed_urls[] | null;
  date: any | null;
  studio: EditDetailsFragment_SceneEdit_studio | null;
  /**
   * Added or modified performer appearance entries
   */
  added_performers: EditDetailsFragment_SceneEdit_added_performers[] | null;
  removed_performers: EditDetailsFragment_SceneEdit_removed_performers[] | null;
  added_tags: EditDetailsFragment_SceneEdit_added_tags[] | null;
  removed_tags: EditDetailsFragment_SceneEdit_removed_tags[] | null;
  added_images: (EditDetailsFragment_SceneEdit_added_images | null)[] | null;
  removed_images: (EditDetailsFragment_SceneEdit_removed_images | null)[] | null;
  added_fingerprints: EditDetailsFragment_SceneEdit_added_fingerprints[] | null;
  removed_fingerprints: EditDetailsFragment_SceneEdit_removed_fingerprints[] | null;
  duration: number | null;
  director: string | null;
}

export type EditDetailsFragment = EditDetailsFragment_TagEdit | EditDetailsFragment_PerformerEdit | EditDetailsFragment_StudioEdit | EditDetailsFragment_SceneEdit;
