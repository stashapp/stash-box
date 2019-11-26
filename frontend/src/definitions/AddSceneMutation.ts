/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { UpdateScene, NewPerformerScene } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddSceneMutation
// ====================================================

export interface AddSceneMutation_addScene_studio {
  id: number;
  title: string;
  uuid: any;
}

export interface AddSceneMutation_addScene_performers_performer {
  name: string;
  displayName: string;
  uuid: any;
  id: number;
  gender: string;
}

export interface AddSceneMutation_addScene_performers {
  alias: string | null;
  performer: AddSceneMutation_addScene_performers_performer;
}

export interface AddSceneMutation_addScene {
  id: number;
  uuid: any;
  title: string | null;
  date: any | null;
  dateAccuracy: number | null;
  photoUrl: string | null;
  description: string | null;
  studioUrl: string | null;
  studio: AddSceneMutation_addScene_studio;
  performers: AddSceneMutation_addScene_performers[];
}

export interface AddSceneMutation {
  addScene: AddSceneMutation_addScene;
}

export interface AddSceneMutationVariables {
  sceneData: UpdateScene;
  performers?: NewPerformerScene[] | null;
}
