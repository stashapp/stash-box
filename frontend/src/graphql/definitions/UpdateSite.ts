/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SiteUpdateInput, ValidSiteTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateSite
// ====================================================

export interface UpdateSite_siteUpdate {
  __typename: "Site";
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  regex: string | null;
  valid_types: ValidSiteTypeEnum[];
}

export interface UpdateSite {
  siteUpdate: UpdateSite_siteUpdate | null;
}

export interface UpdateSiteVariables {
  siteData: SiteUpdateInput;
}
