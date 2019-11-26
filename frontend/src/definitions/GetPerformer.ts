/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetPerformer
// ====================================================

export interface GetPerformer_getPerformer {
  waistSize: number | null;
  tattoos: string[] | null;
  piercings: string[] | null;
  photoUrl: string | null;
  name: string;
  location: string | null;
  hipSize: number | null;
  height: number | null;
  hairColor: string | null;
  gender: string;
  eyeColor: string | null;
  ethnicity: string | null;
  disambiguation: string;
  countryId: number | null;
  careerStart: number | null;
  careerEnd: number | null;
  cupSize: string | null;
  bandSize: number | null;
  boobJob: boolean | null;
  birthdateAccuracy: number | null;
  birthdate: any | null;
  uuid: any;
}

export interface GetPerformer {
  getPerformer: GetPerformer_getPerformer;
}

export interface GetPerformerVariables {
  id: any;
}
