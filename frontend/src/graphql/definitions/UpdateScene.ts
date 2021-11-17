/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.


import { SceneUpdateInput, GenderEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateScene
// ====================================================


export interface UpdateScene_sceneUpdate_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface UpdateScene_sceneUpdate_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface UpdateScene_sceneUpdate_performers_performer {
  __typename: "Performer";
  name: string;
  id: string;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface UpdateScene_sceneUpdate_performers {
  __typename: "PerformerAppearance";
  performer: UpdateScene_sceneUpdate_performers_performer;
}

export interface UpdateScene_sceneUpdate_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
}

export interface UpdateScene_sceneUpdate_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface UpdateScene_sceneUpdate {
  __typename: "Scene";
  id: string;
  date: any | null;
  details: string | null;
  director: string | null;
  duration: number | null;
  title: string | null;
  urls: UpdateScene_sceneUpdate_urls[];
  studio: UpdateScene_sceneUpdate_studio | null;
  performers: UpdateScene_sceneUpdate_performers[];
  fingerprints: UpdateScene_sceneUpdate_fingerprints[];
  tags: UpdateScene_sceneUpdate_tags[];
}

export interface UpdateScene {
  sceneUpdate: UpdateScene_sceneUpdate | null;
}

export interface UpdateSceneVariables {
  updateData: SceneUpdateInput;
}
