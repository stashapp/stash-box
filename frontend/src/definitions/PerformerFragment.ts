/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, DateAccuracyEnum, EthnicityEnum, EyeColorEnum, HairColorEnum, BreastTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL fragment: PerformerFragment
// ====================================================

export interface PerformerFragment_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface PerformerFragment_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface PerformerFragment_measurements {
  __typename: "Measurements";
  cup_size: string | null;
  band_size: number | null;
  waist: number | null;
  hip: number | null;
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

export interface PerformerFragment_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number | null;
  height: number | null;
}

export interface PerformerFragment {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  aliases: string[];
  gender: GenderEnum | null;
  urls: PerformerFragment_urls[];
  birthdate: PerformerFragment_birthdate | null;
  age: number | null;
  ethnicity: EthnicityEnum | null;
  country: string | null;
  eye_color: EyeColorEnum | null;
  hair_color: HairColorEnum | null;
  /**
   * Height in cm
   */
  height: number | null;
  measurements: PerformerFragment_measurements;
  breast_type: BreastTypeEnum | null;
  career_start_year: number | null;
  career_end_year: number | null;
  tattoos: PerformerFragment_tattoos[] | null;
  piercings: PerformerFragment_piercings[] | null;
  images: PerformerFragment_images[];
  deleted: boolean;
}
