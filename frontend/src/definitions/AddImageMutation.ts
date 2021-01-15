/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ImageCreateInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddImageMutation
// ====================================================

export interface AddImageMutation_imageCreate {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface AddImageMutation {
  imageCreate: AddImageMutation_imageCreate | null;
}

export interface AddImageMutationVariables {
  imageData: ImageCreateInput;
}
