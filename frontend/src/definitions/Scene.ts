/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { GenderEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: Scene
// ====================================================

export interface Scene_findScene_urls {
  url: string;
  type: string;
}

export interface Scene_findScene_studio {
  id: string;
  name: string;
}

export interface Scene_findScene_performers_performer {
  name: string;
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

export interface Scene_findScene {
  id: string;
  date: any | null;
  title: string | null;
  details: string | null;
  urls: Scene_findScene_urls[];
  studio: Scene_findScene_studio | null;
  performers: Scene_findScene_performers[];
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
