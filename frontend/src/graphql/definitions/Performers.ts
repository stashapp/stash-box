/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PerformerQueryInput, GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: Performers
// ====================================================

export interface Performers_queryPerformers_performers_birthdate {
  __typename: "FuzzyDate";
  date: GQLDate;
  accuracy: DateAccuracyEnum;
}

export interface Performers_queryPerformers_performers_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface Performers_queryPerformers_performers_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Performers_queryPerformers_performers_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Performers_queryPerformers_performers_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface Performers_queryPerformers_performers_urls {
  __typename: "URL";
  url: string;
  site: Performers_queryPerformers_performers_urls_site;
}

export interface Performers_queryPerformers_performers_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Performers_queryPerformers_performers {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: Performers_queryPerformers_performers_birthdate | null;
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
  measurements: Performers_queryPerformers_performers_measurements;
  tattoos: Performers_queryPerformers_performers_tattoos[] | null;
  piercings: Performers_queryPerformers_performers_piercings[] | null;
  urls: Performers_queryPerformers_performers_urls[];
  images: Performers_queryPerformers_performers_images[];
  is_favorite: boolean;
}

export interface Performers_queryPerformers {
  __typename: "QueryPerformersResultType";
  count: number;
  performers: Performers_queryPerformers_performers[];
}

export interface Performers {
  queryPerformers: Performers_queryPerformers;
}

export interface PerformersVariables {
  input: PerformerQueryInput;
}
