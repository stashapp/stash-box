/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { FingerprintAlgorithm } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UnmatchFingerprint
// ====================================================

export interface UnmatchFingerprint {
  /**
   * Matches/unmatches a scene to fingerprint
   */
  unmatchFingerprint: boolean;
}

export interface UnmatchFingerprintVariables {
  scene_id: string;
  algorithm: FingerprintAlgorithm;
  hash: string;
  duration: number;
}
