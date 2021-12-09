/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ImageCreateInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddImage
// ====================================================

export interface AddImage_imageCreate {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface AddImage {
  imageCreate: AddImage_imageCreate | null;
}

export interface AddImageVariables {
  imageData: ImageCreateInput;
}
