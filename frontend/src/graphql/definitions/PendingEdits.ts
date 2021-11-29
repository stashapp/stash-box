/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.


import { TargetTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL query operation: PendingEdits
// ====================================================


export interface PendingEdits_queryEdits {
  __typename: "QueryEditsResultType";
  count: number;
}

export interface PendingEdits {
  queryEdits: PendingEdits_queryEdits;
}

export interface PendingEditsVariables {
  type: TargetTypeEnum;
  id: string;
}
