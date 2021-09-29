/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: URLFragment
// ====================================================

export interface URLFragment_site {
  __typename: "Site";
  id: string;
  name: string;
}

export interface URLFragment {
  __typename: "URL";
  url: string;
  site: URLFragment_site;
}
