/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: RescindInviteCode
// ====================================================

export interface RescindInviteCode {
  /**
   * Removes a pending invite code - refunding the token
   */
  rescindInviteCode: boolean;
}

export interface RescindInviteCodeVariables {
  code: string;
}
