/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL fragment: SceneFragment
// ====================================================

export interface SceneFragment_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface SceneFragment_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface SceneFragment_studio {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface SceneFragment_performers_performer {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}

export interface SceneFragment_performers {
  __typename: "PerformerAppearance";
  /**
   * Performing as alias
   */
  as: string | null;
  performer: SceneFragment_performers_performer;
}

export interface SceneFragment_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  submissions: number;
  user_submitted: boolean;
  created: any;
  updated: any;
}

export interface SceneFragment_tags {
  __typename: "Tag";
  id: string;
  name: string;
  description: string | null;
}

export interface SceneFragment {
  __typename: "Scene";
  id: string;
  date: any | null;
  title: string | null;
  deleted: boolean;
  details: string | null;
  director: string | null;
  duration: number | null;
  urls: SceneFragment_urls[];
  images: SceneFragment_images[];
  studio: SceneFragment_studio | null;
  performers: SceneFragment_performers[];
  fingerprints: SceneFragment_fingerprints[];
  tags: SceneFragment_tags[];
}
