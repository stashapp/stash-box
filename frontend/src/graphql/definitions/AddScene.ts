/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SceneCreateInput, DateAccuracyEnum, GenderEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddScene
// ====================================================

export interface AddScene_sceneCreate_date {
  __typename: "FuzzyDate";
  date: GQLDate;
  accuracy: DateAccuracyEnum;
}

export interface AddScene_sceneCreate_urls_site {
  __typename: "Site";
  id: string;
  name: string;
}

export interface AddScene_sceneCreate_urls {
  __typename: "URL";
  url: string;
  site: AddScene_sceneCreate_urls_site;
}

export interface AddScene_sceneCreate_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface AddScene_sceneCreate_performers_performer {
  __typename: "Performer";
  name: string;
  id: string;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface AddScene_sceneCreate_performers {
  __typename: "PerformerAppearance";
  performer: AddScene_sceneCreate_performers_performer;
}

export interface AddScene_sceneCreate_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
}

export interface AddScene_sceneCreate_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface AddScene_sceneCreate {
  __typename: "Scene";
  id: string;
  date: AddScene_sceneCreate_date | null;
  title: string | null;
  details: string | null;
  urls: AddScene_sceneCreate_urls[];
  studio: AddScene_sceneCreate_studio | null;
  performers: AddScene_sceneCreate_performers[];
  fingerprints: AddScene_sceneCreate_fingerprints[];
  tags: AddScene_sceneCreate_tags[];
}

export interface AddScene {
  sceneCreate: AddScene_sceneCreate | null;
}

export interface AddSceneVariables {
  sceneData: SceneCreateInput;
}
