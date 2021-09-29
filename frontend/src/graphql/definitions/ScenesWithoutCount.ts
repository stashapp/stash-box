/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { QuerySpec, SceneFilterType, GenderEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: ScenesWithoutCount
// ====================================================

export interface ScenesWithoutCount_queryScenes_scenes_urls_site {
  __typename: "Site";
  id: string;
  name: string;
}

export interface ScenesWithoutCount_queryScenes_scenes_urls {
  __typename: "URL";
  url: string;
  site: ScenesWithoutCount_queryScenes_scenes_urls_site;
}

export interface ScenesWithoutCount_queryScenes_scenes_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface ScenesWithoutCount_queryScenes_scenes_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface ScenesWithoutCount_queryScenes_scenes_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface ScenesWithoutCount_queryScenes_scenes_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: ScenesWithoutCount_queryScenes_scenes_performers_performer;
}

export interface ScenesWithoutCount_queryScenes_scenes {
  __typename: "Scene";
  id: string;
  date: any | null;
  title: string | null;
  duration: number | null;
  urls: ScenesWithoutCount_queryScenes_scenes_urls[];
  images: ScenesWithoutCount_queryScenes_scenes_images[];
  studio: ScenesWithoutCount_queryScenes_scenes_studio | null;
  performers: ScenesWithoutCount_queryScenes_scenes_performers[];
}

export interface ScenesWithoutCount_queryScenes {
  __typename: "QueryScenesResultType";
  scenes: ScenesWithoutCount_queryScenes_scenes[];
}

export interface ScenesWithoutCount {
  queryScenes: ScenesWithoutCount_queryScenes;
}

export interface ScenesWithoutCountVariables {
  filter?: QuerySpec | null;
  sceneFilter?: SceneFilterType | null;
}
