/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import {
  PerformerUpdateInput,
  GenderEnum,
  DateAccuracyEnum,
  HairColorEnum,
  EyeColorEnum,
  EthnicityEnum,
  BreastTypeEnum,
} from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdatePerformerMutation
// ====================================================

export interface UpdatePerformerMutation_performerUpdate_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface UpdatePerformerMutation_performerUpdate_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface UpdatePerformerMutation_performerUpdate_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface UpdatePerformerMutation_performerUpdate_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface UpdatePerformerMutation_performerUpdate {
  __typename: "Performer";
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
