/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: Performer
// ====================================================

export interface Performer_findPerformer_birthdate {
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface Performer_findPerformer_measurements {
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface Performer_findPerformer_tattoos {
  location: string;
  description: string | null;
}

export interface Performer_findPerformer_piercings {
  location: string;
  description: string | null;
}

export interface Performer_findPerformer_urls {
  url: string;
  type: string;
}

export interface Performer_findPerformer {
  id: string;
  name: string;
  disambiguation: string | null;
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
