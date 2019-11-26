/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Studios
// ====================================================

export interface Studios_getStudios {
  id: number;
  uuid: any;
  title: string;
  url: string | null;
  photoUrl: string | null;
}

export interface Studios {
  getStudios: Studios_getStudios[];
}

export interface StudiosVariables {
  limit?: number | null;
  skip?: number | null;
}
