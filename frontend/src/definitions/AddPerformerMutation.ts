/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import {
  PerformerCreateInput,
  GenderEnum,
  DateAccuracyEnum,
  HairColorEnum,
  EyeColorEnum,
  EthnicityEnum,
  BreastTypeEnum,
} from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddPerformerMutation
// ====================================================

export interface AddPerformerMutation_performerCreate_birthdate {
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface AddPerformerMutation_performerCreate_measurements {
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface AddPerformerMutation_performerCreate_tattoos {
  location: string;
  description: string | null;
}

export interface AddPerformerMutation_performerCreate_piercings {
  location: string;
  description: string | null;
}

export interface AddPerformerMutation_performerCreate {
  id: string;
  name: string;
  disambiguation: string | null;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: AddPerformerMutation_performerCreate_birthdate | null;
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
  measurements: AddPerformerMutation_performerCreate_measurements;
  tattoos: AddPerformerMutation_performerCreate_tattoos[] | null;
  piercings: AddPerformerMutation_performerCreate_piercings[] | null;
}

export interface AddPerformerMutation {
  performerCreate: AddPerformerMutation_performerCreate | null;
}

export interface AddPerformerMutationVariables {
  performerData: PerformerCreateInput;
}
