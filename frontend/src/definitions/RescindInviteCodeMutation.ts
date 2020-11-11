/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: RescindInviteCodeMutation
// ====================================================

export interface RescindInviteCodeMutation {
  /**
   * Removes a pending invite code - refunding the token
   */
  rescindInviteCode: boolean;
}

export interface RescindInviteCodeMutationVariables {
  code: string;
}
