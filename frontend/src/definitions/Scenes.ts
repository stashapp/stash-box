/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Scenes
// ====================================================

export interface Scenes_getScenes_studio {
  title: string;
  uuid: any;
}

export interface Scenes_getScenes_performers_performer {
  displayName: string;
  uuid: any;
}

export interface Scenes_getScenes_performers {
  performer: Scenes_getScenes_performers_performer;
}

export interface Scenes_getScenes {
  title: string | null;
  uuid: any;
  date: any | null;
  photoUrl: string | null;
  studio: Scenes_getScenes_studio;
  performers: Scenes_getScenes_performers[];
}

export interface Scenes {
  getScenes: Scenes_getScenes[];
}

export interface ScenesVariables {
  limit?: number | null;
  skip?: number | null;
}
