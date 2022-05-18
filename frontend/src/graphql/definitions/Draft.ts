/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, HairColorEnum, EyeColorEnum, EthnicityEnum, BreastTypeEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL query operation: Draft
// ====================================================

export interface Draft_findDraft_data_PerformerDraft_image {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Draft_findDraft_data_PerformerDraft {
  __typename: "PerformerDraft";
  id: string | null;
  name: string;
  aliases: string | null;
  gender: string | null;
  birthdate: string | null;
  urls: string[] | null;
  ethnicity: string | null;
  country: string | null;
  eye_color: string | null;
  hair_color: string | null;
  height: string | null;
  measurements: string | null;
  breast_type: string | null;
  tattoos: string | null;
  piercings: string | null;
  career_start_year: number | null;
  career_end_year: number | null;
  image: Draft_findDraft_data_PerformerDraft_image | null;
}

export interface Draft_findDraft_data_SceneDraft_url_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface Draft_findDraft_data_SceneDraft_url {
  __typename: "URL";
  url: string;
  site: Draft_findDraft_data_SceneDraft_url_site;
}

export interface Draft_findDraft_data_SceneDraft_studio_Studio_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Draft_findDraft_data_SceneDraft_studio_Studio_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface Draft_findDraft_data_SceneDraft_studio_Studio_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface Draft_findDraft_data_SceneDraft_studio_Studio_urls {
  __typename: "URL";
  url: string;
  site: Draft_findDraft_data_SceneDraft_studio_Studio_urls_site;
}

export interface Draft_findDraft_data_SceneDraft_studio_Studio_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface Draft_findDraft_data_SceneDraft_studio_Studio {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: Draft_findDraft_data_SceneDraft_studio_Studio_child_studios[];
  parent: Draft_findDraft_data_SceneDraft_studio_Studio_parent | null;
  urls: Draft_findDraft_data_SceneDraft_studio_Studio_urls[];
  images: Draft_findDraft_data_SceneDraft_studio_Studio_images[];
  deleted: boolean;
  is_favorite: boolean;
}

export interface Draft_findDraft_data_SceneDraft_studio_DraftEntity {
  __typename: "DraftEntity";
  draftID: string | null;
  name: string;
}

export type Draft_findDraft_data_SceneDraft_studio = Draft_findDraft_data_SceneDraft_studio_Studio | Draft_findDraft_data_SceneDraft_studio_DraftEntity;

export interface Draft_findDraft_data_SceneDraft_performers_Performer_measurements {
  __typename: "Measurements";
  waist: number | null;
  hip: number | null;
  band_size: number | null;
  cup_size: string | null;
}

export interface Draft_findDraft_data_SceneDraft_performers_Performer_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Draft_findDraft_data_SceneDraft_performers_Performer_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface Draft_findDraft_data_SceneDraft_performers_Performer_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface Draft_findDraft_data_SceneDraft_performers_Performer_urls {
  __typename: "URL";
  url: string;
  site: Draft_findDraft_data_SceneDraft_performers_Performer_urls_site;
}

export interface Draft_findDraft_data_SceneDraft_performers_Performer_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Draft_findDraft_data_SceneDraft_performers_Performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  aliases: string[];
  gender: GenderEnum | null;
  birth_date: string | null;
  age: number | null;
  /**
   * Height in cm
   */
  height: number | null;
  hair_color: HairColorEnum | null;
  eye_color: EyeColorEnum | null;
  ethnicity: EthnicityEnum | null;
  country: string | null;
  career_end_year: number | null;
  career_start_year: number | null;
  breast_type: BreastTypeEnum | null;
  measurements: Draft_findDraft_data_SceneDraft_performers_Performer_measurements;
  tattoos: Draft_findDraft_data_SceneDraft_performers_Performer_tattoos[] | null;
  piercings: Draft_findDraft_data_SceneDraft_performers_Performer_piercings[] | null;
  urls: Draft_findDraft_data_SceneDraft_performers_Performer_urls[];
  images: Draft_findDraft_data_SceneDraft_performers_Performer_images[];
  is_favorite: boolean;
}

export interface Draft_findDraft_data_SceneDraft_performers_DraftEntity {
  __typename: "DraftEntity";
  draftID: string | null;
  name: string;
}

export type Draft_findDraft_data_SceneDraft_performers = Draft_findDraft_data_SceneDraft_performers_Performer | Draft_findDraft_data_SceneDraft_performers_DraftEntity;

export interface Draft_findDraft_data_SceneDraft_tags_Tag_category {
  __typename: "TagCategory";
  id: string;
  name: string;
}

export interface Draft_findDraft_data_SceneDraft_tags_Tag {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
  deleted: boolean;
  category: Draft_findDraft_data_SceneDraft_tags_Tag_category | null;
  aliases: string[];
}

export interface Draft_findDraft_data_SceneDraft_tags_DraftEntity {
  __typename: "DraftEntity";
  draftID: string | null;
  name: string;
}

export type Draft_findDraft_data_SceneDraft_tags = Draft_findDraft_data_SceneDraft_tags_Tag | Draft_findDraft_data_SceneDraft_tags_DraftEntity;

export interface Draft_findDraft_data_SceneDraft_fingerprints {
  __typename: "DraftFingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
}

export interface Draft_findDraft_data_SceneDraft_image {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface Draft_findDraft_data_SceneDraft {
  __typename: "SceneDraft";
  id: string | null;
  title: string | null;
  details: string | null;
  date: string | null;
  url: Draft_findDraft_data_SceneDraft_url | null;
  studio: Draft_findDraft_data_SceneDraft_studio | null;
  performers: Draft_findDraft_data_SceneDraft_performers[];
  tags: Draft_findDraft_data_SceneDraft_tags[] | null;
  fingerprints: Draft_findDraft_data_SceneDraft_fingerprints[];
  image: Draft_findDraft_data_SceneDraft_image | null;
}

export type Draft_findDraft_data = Draft_findDraft_data_PerformerDraft | Draft_findDraft_data_SceneDraft;

export interface Draft_findDraft {
  __typename: "Draft";
  id: string;
  created: GQLTime;
  expires: GQLTime;
  data: Draft_findDraft_data;
}

export interface Draft {
  findDraft: Draft_findDraft | null;
}

export interface DraftVariables {
  id: string;
}
