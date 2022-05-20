/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ValidSiteTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: Site
// ====================================================

export interface Site_findSite {
  __typename: "Site";
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  regex: string | null;
  valid_types: ValidSiteTypeEnum[];
  icon: string;
  created: GQLTime;
  updated: GQLTime;
}

export interface Site {
  /**
   * Find an external site by ID
   */
  findSite: Site_findSite | null;
}

export interface SiteVariables {
  id: string;
}
