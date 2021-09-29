/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, DateAccuracyEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: SearchPerformers
// ====================================================

export interface SearchPerformers_searchPerformer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface SearchPerformers_searchPerformer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
}

export interface SearchPerformers_searchPerformer_urls {
  __typename: "URL";
  url: string;
  site: SearchPerformers_searchPerformer_urls_site;
}

export interface SearchPerformers_searchPerformer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SearchPerformers_searchPerformer {
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
  birthdate: SearchPerformers_searchPerformer_birthdate | null;
  urls: SearchPerformers_searchPerformer_urls[];
  images: SearchPerformers_searchPerformer_images[];
}

export interface SearchPerformers {
  searchPerformer: SearchPerformers_searchPerformer[];
}

export interface SearchPerformersVariables {
  term: string;
  limit?: number | null;
}
