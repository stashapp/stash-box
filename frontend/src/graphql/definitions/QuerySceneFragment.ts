/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { DateAccuracyEnum, GenderEnum } from "./globalTypes";

// ====================================================
// GraphQL fragment: QuerySceneFragment
// ====================================================

export interface QuerySceneFragment_date {
  __typename: "FuzzyDate";
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface QuerySceneFragment_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface QuerySceneFragment_urls {
  __typename: "URL";
  url: string;
  site: QuerySceneFragment_urls_site;
}

export interface QuerySceneFragment_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface QuerySceneFragment_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface QuerySceneFragment_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface QuerySceneFragment_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: QuerySceneFragment_performers_performer;
}

export interface QuerySceneFragment {
  __typename: "Scene";
  id: string;
  date: QuerySceneFragment_date | null;
  title: string | null;
  duration: number | null;
  urls: QuerySceneFragment_urls[];
  images: QuerySceneFragment_images[];
  studio: QuerySceneFragment_studio | null;
  performers: QuerySceneFragment_performers[];
}
