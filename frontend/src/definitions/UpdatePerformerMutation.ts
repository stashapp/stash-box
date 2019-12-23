/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { PerformerUpdateInput, GenderEnum, DateAccuracyEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdatePerformerMutation
// ====================================================

export interface UpdatePerformerMutation_performerUpdate_birthdate {
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface UpdatePerformerMutation_performerUpdate_measurements {
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface UpdatePerformerMutation_performerUpdate_tattoos {
  location: string;
  description: string | null;
}

export interface UpdatePerformerMutation_performerUpdate_piercings {
  location: string;
  description: string | null;
}

export interface UpdatePerformerMutation_performerUpdate {
  id: string;
  name: string;
  disambiguation: string | null;
  aliases: string[];
  gender: GenderEnum | null;
  birthdate: UpdatePerformerMutation_performerUpdate_birthdate | null;
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
  measurements: UpdatePerformerMutation_performerUpdate_measurements;
  tattoos: UpdatePerformerMutation_performerUpdate_tattoos[] | null;
  piercings: UpdatePerformerMutation_performerUpdate_piercings[] | null;
}

export interface UpdatePerformerMutation {
  performerUpdate: UpdatePerformerMutation_performerUpdate | null;
}

export interface UpdatePerformerMutationVariables {
  performerData: PerformerUpdateInput;
}
