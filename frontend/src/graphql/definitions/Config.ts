/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Config
// ====================================================

export interface Config_getConfig {
  __typename: "StashBoxConfig";
  host_url: string;
  require_invite: boolean;
  require_activation: boolean;
  vote_promotion_threshold: number | null;
  vote_application_threshold: number;
  voting_period: number;
  min_destructive_voting_period: number;
  vote_cron_interval: string;
}

export interface Config {
  getConfig: Config_getConfig;
}
