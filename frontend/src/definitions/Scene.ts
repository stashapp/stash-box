/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Scene
// ====================================================

export interface Scene_getScene_studio {
  id: number;
  title: string;
  uuid: any;
}

export interface Scene_getScene_performers_performer {
  name: string;
  displayName: string;
  uuid: any;
  id: number;
  gender: string;
}

export interface Scene_getScene_performers {
  alias: string | null;
  performer: Scene_getScene_performers_performer;
}

export interface Scene_getScene {
  id: number;
  uuid: any;
  title: string | null;
  date: any | null;
  dateAccuracy: number | null;
  photoUrl: string | null;
  description: string | null;
  studioUrl: string | null;
  studio: Scene_getScene_studio;
  performers: Scene_getScene_performers[];
}

export interface Scene {
  getScene: Scene_getScene;
}

export interface SceneVariables {
  id: any;
}
