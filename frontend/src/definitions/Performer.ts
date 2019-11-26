/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Performer
// ====================================================

export interface Performer_getPerformer_performances_studio {
  title: string;
  uuid: any;
}

export interface Performer_getPerformer_performances {
  title: string | null;
  uuid: any;
  date: any | null;
  photoUrl: string | null;
  studio: Performer_getPerformer_performances_studio;
}

export interface Performer_getPerformer {
  id: number;
  uuid: any;
  waistSize: number | null;
  tattoos: string[] | null;
  piercings: string[] | null;
  photoUrl: string | null;
  name: string;
  displayName: string;
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
  aliases: string[] | null;
  performances: Performer_getPerformer_performances[];
}

export interface Performer {
  getPerformer: Performer_getPerformer;
}

export interface PerformerVariables {
  id: any;
}
