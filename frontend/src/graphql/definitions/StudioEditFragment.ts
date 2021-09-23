/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: StudioEditFragment
// ====================================================

export interface StudioEditFragment_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface StudioEditFragment_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface StudioEditFragment_parent_child_studios {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface StudioEditFragment_parent_parent {
  __typename: "Studio";
  id: string;
  name: string;
}

export interface StudioEditFragment_parent_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface StudioEditFragment_parent_images {
  __typename: "Image";
  id: string;
  url: string;
  height: number;
  width: number;
}

export interface StudioEditFragment_parent {
  __typename: "Studio";
  id: string;
  name: string;
  child_studios: StudioEditFragment_parent_child_studios[];
  parent: StudioEditFragment_parent_parent | null;
  urls: StudioEditFragment_parent_urls[];
  images: StudioEditFragment_parent_images[];
  deleted: boolean;
}

export interface StudioEditFragment_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface StudioEditFragment_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface StudioEditFragment {
  __typename: "StudioEdit";
  name: string | null;
  /**
   * Added and modified URLs
   */
  added_urls: StudioEditFragment_added_urls[] | null;
  removed_urls: StudioEditFragment_removed_urls[] | null;
  parent: StudioEditFragment_parent | null;
  added_images: (StudioEditFragment_added_images | null)[] | null;
  removed_images: (StudioEditFragment_removed_images | null)[] | null;
}
