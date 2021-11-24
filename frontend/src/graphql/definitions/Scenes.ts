/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.


import { QuerySpec, SceneFilterType, GenderEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: Scenes
// ====================================================


export interface Scenes_queryScenes_scenes_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface Scenes_queryScenes_scenes_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Scenes_queryScenes_scenes_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Scenes_queryScenes_scenes_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface Scenes_queryScenes_scenes_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: Scenes_queryScenes_scenes_performers_performer;
}

export interface Scenes_queryScenes_scenes {
  __typename: "Scene";
  id: string;
  date: any | null;
  title: string | null;
  duration: number | null;
  urls: Scenes_queryScenes_scenes_urls[];
  images: Scenes_queryScenes_scenes_images[];
  studio: Scenes_queryScenes_scenes_studio | null;
  performers: Scenes_queryScenes_scenes_performers[];
}

export interface Scenes_queryScenes {
  __typename: "QueryScenesResultType";
  count: number;
  scenes: Scenes_queryScenes_scenes[];
}

export interface Scenes {
  queryScenes: Scenes_queryScenes;
}

export interface ScenesVariables {
  filter?: QuerySpec | null;
  sceneFilter?: SceneFilterType | null;
}
