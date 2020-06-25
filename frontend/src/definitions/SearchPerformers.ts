/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, DateAccuracyEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: SearchPerformers
// ====================================================

export interface SearchPerformers_searchPerformer_birthdate {
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface SearchPerformers_searchPerformer_urls {
  url: string;
  type: string;
}

export interface SearchPerformers_searchPerformer_images {
  id: string;
  url: string;
  height: number | null;
  width: number | null;
}

export interface SearchPerformers_searchPerformer {
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
