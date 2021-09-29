/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, DateAccuracyEnum } from "./globalTypes";

// ====================================================
// GraphQL fragment: SearchPerformerFragment
// ====================================================

export interface SearchPerformerFragment_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface SearchPerformerFragment_urls_site {
  __typename: "Site";
  id: string;
  name: string;
}

export interface SearchPerformerFragment_urls {
  __typename: "URL";
  url: string;
  site: SearchPerformerFragment_urls_site;
}

export interface SearchPerformerFragment_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SearchPerformerFragment {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
  country: string | null;
  career_start_year: number | null;
  career_end_year: number | null;
  scene_count: number;
  birthdate: SearchPerformerFragment_birthdate | null;
  urls: SearchPerformerFragment_urls[];
  images: SearchPerformerFragment_images[];
}
