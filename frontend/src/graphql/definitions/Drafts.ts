/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Drafts
// ====================================================

export interface Drafts_findDrafts_data_PerformerDraft {
  __typename: "PerformerDraft";
  name: string;
}

export interface Drafts_findDrafts_data_SceneDraft {
  __typename: "SceneDraft";
  title: string | null;
}

export type Drafts_findDrafts_data = Drafts_findDrafts_data_PerformerDraft | Drafts_findDrafts_data_SceneDraft;

export interface Drafts_findDrafts {
  __typename: "Draft";
  id: string;
  created: any;
  expires: any;
  data: Drafts_findDrafts_data;
}

export interface Drafts {
  findDrafts: Drafts_findDrafts[];
}
