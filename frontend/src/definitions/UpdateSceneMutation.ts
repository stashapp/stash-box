/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { UpdateScene, NewPerformerScene } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateSceneMutation
// ====================================================

export interface UpdateSceneMutation_updateScene_studio {
  id: number;
  title: string;
  uuid: any;
}

export interface UpdateSceneMutation_updateScene_performers_performer {
  name: string;
  displayName: string;
  uuid: any;
  id: number;
  gender: string;
}

export interface UpdateSceneMutation_updateScene_performers {
  alias: string | null;
  performer: UpdateSceneMutation_updateScene_performers_performer;
}

export interface UpdateSceneMutation_updateScene {
  id: number;
  uuid: any;
  title: string | null;
  date: any | null;
  dateAccuracy: number | null;
  photoUrl: string | null;
  description: string | null;
  studioUrl: string | null;
  studio: UpdateSceneMutation_updateScene_studio;
  performers: UpdateSceneMutation_updateScene_performers[];
}

export interface UpdateSceneMutation {
  updateScene: UpdateSceneMutation_updateScene;
}

export interface UpdateSceneMutationVariables {
  sceneId: number;
  sceneData: UpdateScene;
  performers?: NewPerformerScene[] | null;
}
