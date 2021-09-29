/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: Performer
// ====================================================

export interface Performer_findPerformer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface Performer_findPerformer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface Performer_findPerformer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Performer_findPerformer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Performer_findPerformer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
}

export interface Performer_findPerformer_urls {
  __typename: "URL";
  url: string;
  site: Performer_findPerformer_urls_site;
}

export interface Performer_findPerformer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Performer_findPerformer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: Performer_findPerformer_birthdate | null;
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
  measurements: Performer_findPerformer_measurements;
  tattoos: Performer_findPerformer_tattoos[] | null;
  piercings: Performer_findPerformer_piercings[] | null;
  urls: Performer_findPerformer_urls[];
  images: Performer_findPerformer_images[];
}

export interface Performer {
  /**
   * Find a performer by ID
   */
  findPerformer: Performer_findPerformer | null;
}

export interface PerformerVariables {
  id: string;
}
