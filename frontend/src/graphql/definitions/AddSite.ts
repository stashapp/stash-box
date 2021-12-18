/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SiteCreateInput, ValidSiteTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddSite
// ====================================================

export interface AddSite_siteCreate {
  __typename: "Site";
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  regex: string | null;
  valid_types: ValidSiteTypeEnum[];
}

export interface AddSite {
  siteCreate: AddSite_siteCreate | null;
}

export interface AddSiteVariables {
  siteData: SiteCreateInput;
}
