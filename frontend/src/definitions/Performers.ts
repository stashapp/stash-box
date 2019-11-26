/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Performers
// ====================================================

export interface Performers_getPerformers {
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
  id: number;
}

export interface Performers {
  getPerformers: Performers_getPerformers[];
}

export interface PerformersVariables {
  limit?: number | null;
  skip?: number | null;
}
