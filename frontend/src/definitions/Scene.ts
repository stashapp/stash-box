/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL query operation: Scene
// ====================================================

export interface Scene_findScene_urls {
  url: string;
  type: string;
}

export interface Scene_findScene_images {
  id: string;
  url: string;
  height: number | null;
  width: number | null;
}

export interface Scene_findScene_studio {
  id: string;
  name: string;
}

export interface Scene_findScene_performers_performer {
  name: string;
  disambiguation: string | null;
  id: string;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface Scene_findScene_performers {
  /**
   * Performing as alias
   */
  as: string | null;
  performer: Scene_findScene_performers_performer;
}

export interface Scene_findScene_fingerprints {
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
}

export interface Scene_findScene_tags {
  id: string;
  name: string;
  description: string | null;
}

export interface Scene_findScene {
  id: string;
  date: any | null;
  title: string | null;
  details: string | null;
  director: string | null;
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
