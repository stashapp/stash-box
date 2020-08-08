/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SceneUpdateInput, GenderEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateSceneMutation
// ====================================================

export interface UpdateSceneMutation_sceneUpdate_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface UpdateSceneMutation_sceneUpdate_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface UpdateSceneMutation_sceneUpdate_performers_performer {
  __typename: "Performer";
  name: string;
  id: string;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface UpdateSceneMutation_sceneUpdate_performers {
  __typename: "PerformerAppearance";
  performer: UpdateSceneMutation_sceneUpdate_performers_performer;
}

export interface UpdateSceneMutation_sceneUpdate_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
}

export interface UpdateSceneMutation_sceneUpdate_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface UpdateSceneMutation_sceneUpdate {
  __typename: "Scene";
  id: string;
  date: any | null;
  title: string | null;
  urls: UpdateSceneMutation_sceneUpdate_urls[];
  studio: UpdateSceneMutation_sceneUpdate_studio | null;
  performers: UpdateSceneMutation_sceneUpdate_performers[];
  fingerprints: UpdateSceneMutation_sceneUpdate_fingerprints[];
  tags: UpdateSceneMutation_sceneUpdate_tags[];
}

export interface UpdateSceneMutation {
  sceneUpdate: UpdateSceneMutation_sceneUpdate | null;
}

export interface UpdateSceneMutationVariables {
  updateData: SceneUpdateInput;
}
