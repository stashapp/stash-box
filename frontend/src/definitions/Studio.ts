/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Studio
// ====================================================

export interface Studio_getStudio_scenes_studio {
  title: string;
  uuid: any;
}

export interface Studio_getStudio_scenes_performers_performer {
  displayName: string;
  uuid: any;
}

export interface Studio_getStudio_scenes_performers {
  performer: Studio_getStudio_scenes_performers_performer;
}

export interface Studio_getStudio_scenes {
  title: string | null;
  uuid: any;
  date: any | null;
  photoUrl: string | null;
  studio: Studio_getStudio_scenes_studio;
  performers: Studio_getStudio_scenes_performers[];
}

export interface Studio_getStudio {
  id: number;
  uuid: any;
  title: string;
  url: string | null;
  photoUrl: string | null;
  sceneCount: number;
  scenes: Studio_getStudio_scenes[];
}

export interface Studio {
  getStudio: Studio_getStudio;
}

export interface StudioVariables {
  id: any;
  skip?: number | null;
  limit?: number | null;
}
