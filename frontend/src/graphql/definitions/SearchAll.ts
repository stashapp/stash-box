/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, DateAccuracyEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: SearchAll
// ====================================================

export interface SearchAll_searchPerformer_birthdate {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface SearchAll_searchPerformer_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface SearchAll_searchPerformer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SearchAll_searchPerformer {
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
  birthdate: SearchAll_searchPerformer_birthdate | null;
  urls: SearchAll_searchPerformer_urls[];
  images: SearchAll_searchPerformer_images[];
}

export interface SearchAll_searchScene_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface SearchAll_searchScene_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SearchAll_searchScene_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SearchAll_searchScene_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  gender: GenderEnum | null;
  aliases: string[];
  deleted: boolean;
}

export interface SearchAll_searchScene_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: SearchAll_searchScene_performers_performer;
}

export interface SearchAll_searchScene {
  __typename: "Scene";
  id: string;
  date: any | null;
  title: string | null;
  duration: number | null;
  urls: SearchAll_searchScene_urls[];
  images: SearchAll_searchScene_images[];
  studio: SearchAll_searchScene_studio | null;
  performers: SearchAll_searchScene_performers[];
}

export interface SearchAll {
  searchPerformer: SearchAll_searchPerformer[];
  searchScene: SearchAll_searchScene[];
}

export interface SearchAllVariables {
  term: string;
  limit?: number | null;
}
