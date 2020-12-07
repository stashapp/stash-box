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

export interface SearchPerformerFragment_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface SearchPerformerFragment_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number | null;
  height: number | null;
}

export interface SearchPerformerFragment {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
  birthdate: SearchPerformerFragment_birthdate | null;
  urls: SearchPerformerFragment_urls[];
  images: SearchPerformerFragment_images[];
}
