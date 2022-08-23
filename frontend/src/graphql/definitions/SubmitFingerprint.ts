/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { FingerprintSubmission } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: SubmitFingerprint
// ====================================================

export interface SubmitFingerprint {
  /**
   * Matches/unmatches a scene to fingerprint
   */
  submitFingerprint: boolean;
}

export interface SubmitFingerprintVariables {
  input: FingerprintSubmission;
}
