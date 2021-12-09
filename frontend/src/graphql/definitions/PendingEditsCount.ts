/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TargetTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: PendingEditsCount
// ====================================================

export interface PendingEditsCount_queryEdits {
  __typename: "QueryEditsResultType";
  count: number;
}

export interface PendingEditsCount {
  queryEdits: PendingEditsCount_queryEdits;
}

export interface PendingEditsCountVariables {
  type: TargetTypeEnum;
  id: string;
}
