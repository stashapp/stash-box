/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ValidSiteTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: Sites
// ====================================================

export interface Sites_querySites_sites {
  __typename: "Site";
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  regex: string | null;
  valid_types: ValidSiteTypeEnum[];
  created: any;
  updated: any;
}

export interface Sites_querySites {
  __typename: "QuerySitesResultType";
  sites: Sites_querySites_sites[];
}

export interface Sites {
  querySites: Sites_querySites;
}
