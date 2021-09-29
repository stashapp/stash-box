/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: FullPerformer
// ====================================================

export interface FullPerformer_findPerformer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface FullPerformer_findPerformer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface FullPerformer_findPerformer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface FullPerformer_findPerformer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface FullPerformer_findPerformer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
}

export interface FullPerformer_findPerformer_urls {
  __typename: "URL";
  url: string;
  site: FullPerformer_findPerformer_urls_site;
}

export interface FullPerformer_findPerformer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface FullPerformer_findPerformer_studios_studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface FullPerformer_findPerformer_studios_studio {
  __typename: "Studio";
  id: string;
  name: string;
  parent: FullPerformer_findPerformer_studios_studio_parent | null;
}

export interface FullPerformer_findPerformer_studios {
  __typename: "PerformerStudio";
  scene_count: number;
  studio: FullPerformer_findPerformer_studios_studio;
}

export interface FullPerformer_findPerformer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: FullPerformer_findPerformer_birthdate | null;
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
  measurements: FullPerformer_findPerformer_measurements;
  tattoos: FullPerformer_findPerformer_tattoos[] | null;
  piercings: FullPerformer_findPerformer_piercings[] | null;
  urls: FullPerformer_findPerformer_urls[];
  images: FullPerformer_findPerformer_images[];
  studios: FullPerformer_findPerformer_studios[];
}

export interface FullPerformer {
  /**
   * Find a performer by ID
   */
  findPerformer: FullPerformer_findPerformer | null;
}

export interface FullPerformerVariables {
  id: string;
}
