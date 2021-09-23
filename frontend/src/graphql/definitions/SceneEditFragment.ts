/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL fragment: SceneEditFragment
// ====================================================

export interface SceneEditFragment_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface SceneEditFragment_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface SceneEditFragment_studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEditFragment_studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneEditFragment_studio_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface SceneEditFragment_studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface SceneEditFragment_studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: SceneEditFragment_studio_child_studios[];
  parent: SceneEditFragment_studio_parent | null;
  urls: SceneEditFragment_studio_urls[];
  images: SceneEditFragment_studio_images[];
  deleted: boolean;
}

export interface SceneEditFragment_added_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface SceneEditFragment_added_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface SceneEditFragment_added_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEditFragment_added_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEditFragment_added_performers_performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface SceneEditFragment_added_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEditFragment_added_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: SceneEditFragment_added_performers_performer_birthdate | null;
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
  measurements: SceneEditFragment_added_performers_performer_measurements;
  tattoos: SceneEditFragment_added_performers_performer_tattoos[] | null;
  piercings: SceneEditFragment_added_performers_performer_piercings[] | null;
  urls: SceneEditFragment_added_performers_performer_urls[];
  images: SceneEditFragment_added_performers_performer_images[];
}

export interface SceneEditFragment_added_performers {
  __typename: "PerformerAppearance";
  performer: SceneEditFragment_added_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface SceneEditFragment_removed_performers_performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface SceneEditFragment_removed_performers_performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface SceneEditFragment_removed_performers_performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEditFragment_removed_performers_performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface SceneEditFragment_removed_performers_performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface SceneEditFragment_removed_performers_performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEditFragment_removed_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: SceneEditFragment_removed_performers_performer_birthdate | null;
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
  measurements: SceneEditFragment_removed_performers_performer_measurements;
  tattoos: SceneEditFragment_removed_performers_performer_tattoos[] | null;
  piercings: SceneEditFragment_removed_performers_performer_piercings[] | null;
  urls: SceneEditFragment_removed_performers_performer_urls[];
  images: SceneEditFragment_removed_performers_performer_images[];
}

export interface SceneEditFragment_removed_performers {
  __typename: "PerformerAppearance";
  performer: SceneEditFragment_removed_performers_performer;
  /**
   * Performing as alias
   */
  as: string | null;
}

export interface SceneEditFragment_added_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface SceneEditFragment_added_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: SceneEditFragment_added_tags_category | null;
}

export interface SceneEditFragment_removed_tags_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface SceneEditFragment_removed_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: SceneEditFragment_removed_tags_category | null;
}

export interface SceneEditFragment_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEditFragment_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneEditFragment_added_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  created: any;
  updated: any;
}

export interface SceneEditFragment_removed_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  created: any;
  updated: any;
}

export interface SceneEditFragment {
  __typename: "SceneEdit";
  title: string | null;
  details: string | null;
  added_urls: SceneEditFragment_added_urls[] | null;
  removed_urls: SceneEditFragment_removed_urls[] | null;
  date: any | null;
  studio: SceneEditFragment_studio | null;
  /**
   * Added or modified performer appearance entries
   */
  added_performers: SceneEditFragment_added_performers[] | null;
  removed_performers: SceneEditFragment_removed_performers[] | null;
  added_tags: SceneEditFragment_added_tags[] | null;
  removed_tags: SceneEditFragment_removed_tags[] | null;
  added_images: (SceneEditFragment_added_images | null)[] | null;
  removed_images: (SceneEditFragment_removed_images | null)[] | null;
  added_fingerprints: SceneEditFragment_added_fingerprints[] | null;
  removed_fingerprints: SceneEditFragment_removed_fingerprints[] | null;
  duration: number | null;
  director: string | null;
}
