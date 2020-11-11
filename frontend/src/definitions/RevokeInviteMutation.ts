/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { RevokeInviteInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: RevokeInviteMutation
// ====================================================

export interface RevokeInviteMutation {
  /**
   * Removes invite tokens from a user
   */
  revokeInvite: number;
}

export interface RevokeInviteMutationVariables {
  input: RevokeInviteInput;
}
