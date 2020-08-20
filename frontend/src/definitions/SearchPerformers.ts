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

export interface SearchPerformers_searchPerformer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface SearchPerformers_searchPerformer_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number | null;
  width: number | null;
}

export interface SearchPerformers_searchPerformer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  gender: GenderEnum | null;
  aliases: string[];
  birthdate: SearchPerformers_searchPerformer_birthdate | null;
  urls: SearchPerformers_searchPerformer_urls[];
  images: SearchPerformers_searchPerformer_images[];
}

export interface SearchPerformers {
  searchPerformer: (SearchPerformers_searchPerformer | null)[];
}

export interface SearchPerformersVariables {
  term: string;
}
