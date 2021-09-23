/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL fragment: EditTargetFragment
// ====================================================

export interface EditTargetFragment_Tag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface EditTargetFragment_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: EditTargetFragment_Tag_category | null;
}

export interface EditTargetFragment_Performer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface EditTargetFragment_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface EditTargetFragment_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditTargetFragment_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface EditTargetFragment_Performer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditTargetFragment_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditTargetFragment_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: EditTargetFragment_Performer_birthdate | null;
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
  measurements: EditTargetFragment_Performer_measurements;
  tattoos: EditTargetFragment_Performer_tattoos[] | null;
  piercings: EditTargetFragment_Performer_piercings[] | null;
  urls: EditTargetFragment_Performer_urls[];
  images: EditTargetFragment_Performer_images[];
}

export interface EditTargetFragment_Studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditTargetFragment_Studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditTargetFragment_Studio_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditTargetFragment_Studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface EditTargetFragment_Studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: EditTargetFragment_Studio_child_studios[];
  parent: EditTargetFragment_Studio_parent | null;
  urls: EditTargetFragment_Studio_urls[];
  images: EditTargetFragment_Studio_images[];
  deleted: boolean;
}

export interface EditTargetFragment_Scene_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface EditTargetFragment_Scene_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface EditTargetFragment_Scene_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface EditTargetFragment_Scene_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface EditTargetFragment_Scene_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: EditTargetFragment_Scene_performers_performer;
}

export interface EditTargetFragment_Scene_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  created: any;
  updated: any;
}

export interface EditTargetFragment_Scene_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface EditTargetFragment_Scene {
  __typename: "Scene";
  id: string;
  date: any | null;
  title: string | null;
  details: string | null;
  director: string | null;
  duration: number | null;
  urls: EditTargetFragment_Scene_urls[];
  images: EditTargetFragment_Scene_images[];
  studio: EditTargetFragment_Scene_studio | null;
  performers: EditTargetFragment_Scene_performers[];
  fingerprints: EditTargetFragment_Scene_fingerprints[];
  tags: EditTargetFragment_Scene_tags[];
}

export type EditTargetFragment = EditTargetFragment_Tag | EditTargetFragment_Performer | EditTargetFragment_Studio | EditTargetFragment_Scene;
