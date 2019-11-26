/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export interface NewPerformerScene {
  performerId: number;
  alias?: string | null;
}

export interface UpdatePerformer {
  name: string;
  disambiguation: string;
  gender: string;
  aliases?: string[] | null;
  birthdate?: any | null;
  birthdateAccuracy?: number | null;
  height?: number | null;
  eyeColor?: string | null;
  hairColor?: string | null;
  boobJob?: boolean | null;
  cupSize?: string | null;
  bandSize?: number | null;
  waistSize?: number | null;
  hipSize?: number | null;
  tattoos?: string[] | null;
  piercings?: string[] | null;
  ethnicity?: string | null;
  countryId?: number | null;
  location?: string | null;
  photoUrl?: string | null;
  careerStart?: number | null;
  careerEnd?: number | null;
}

export interface UpdateScene {
  studioId: number;
  title?: string | null;
  date?: any | null;
  dateAccuracy?: number | null;
  description?: string | null;
  duration?: number | null;
  photoUrl?: string | null;
  studioUrl?: string | null;
  checksums?: string[] | null;
}

export interface UpdateStudio {
  parentId?: number | null;
  title: string;
  url?: string | null;
  photoUrl?: string | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
