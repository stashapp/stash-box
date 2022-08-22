/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MyFingerprints
// ====================================================

export interface MyFingerprints_myFingerprints_fingerprints {
  __typename: "Fingerprint";
  hash: string;
  duration: number;
  created: GQLTime;
}

export interface MyFingerprints_myFingerprints {
  __typename: "QueryFingerprintResultType";
  count: number;
  fingerprints: MyFingerprints_myFingerprints_fingerprints[];
}

export interface MyFingerprints {
  /**
   * Returns fingerprints submitted by current user
   */
  myFingerprints: MyFingerprints_myFingerprints;
}
