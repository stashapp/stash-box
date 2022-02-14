/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL query operation: Scene
// ====================================================

export interface Scene_findScene_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface Scene_findScene_urls {
  __typename: "URL";
  url: string;
  site: Scene_findScene_urls_site;
}

export interface Scene_findScene_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Scene_findScene_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Scene_findScene_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface Scene_findScene_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: Scene_findScene_performers_performer;
}

export interface Scene_findScene_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  user_submitted: boolean;
  created: any;
  updated: any;
}

export interface Scene_findScene_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface Scene_findScene {
  __typename: "Scene";
  id: string;
  date: any | null;
  title: string | null;
  deleted: boolean;
  details: string | null;
  director: string | null;
  code: string | null;
  duration: number | null;
  urls: Scene_findScene_urls[];
  images: Scene_findScene_images[];
  studio: Scene_findScene_studio | null;
  performers: Scene_findScene_performers[];
  fingerprints: Scene_findScene_fingerprints[];
  tags: Scene_findScene_tags[];
}

export interface Scene {
  /**
   * Find a scene by ID
   */
  findScene: Scene_findScene | null;
}

export interface SceneVariables {
  id: string;
}
