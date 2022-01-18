/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: StudioFragment
// ====================================================

export interface StudioFragment_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface StudioFragment_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface StudioFragment_urls_site {
  __typename: "Site";
  id: string;
  name: string;
  icon: string;
}

export interface StudioFragment_urls {
  __typename: "URL";
  url: string;
  site: StudioFragment_urls_site;
}

export interface StudioFragment_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface StudioFragment {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: StudioFragment_child_studios[];
  parent: StudioFragment_parent | null;
  urls: StudioFragment_urls[];
  images: StudioFragment_images[];
  deleted: boolean;
  is_favorite: boolean;
}
