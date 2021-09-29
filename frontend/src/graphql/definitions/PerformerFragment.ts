/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL fragment: PerformerFragment
// ====================================================

export interface PerformerFragment_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface PerformerFragment_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface PerformerFragment_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface PerformerFragment_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface PerformerFragment_urls_site {
  __typename: "Site";
  id: string;
  name: string;
}

export interface PerformerFragment_urls {
  __typename: "URL";
  url: string;
  site: PerformerFragment_urls_site;
}

export interface PerformerFragment_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface PerformerFragment {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: PerformerFragment_birthdate | null;
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
  measurements: PerformerFragment_measurements;
  tattoos: PerformerFragment_tattoos[] | null;
  piercings: PerformerFragment_piercings[] | null;
  urls: PerformerFragment_urls[];
  images: PerformerFragment_images[];
}
