/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Tag
// ====================================================

export interface Tag_findTag {
  id: string;
  name: string;
  description: string | null;
  aliases: string[];
  deleted: boolean;
}

export interface Tag {
  /**
   * Find a tag by ID or name, or aliases
   */
  findTag: Tag_findTag | null;
}

export interface TagVariables {
  name?: string | null;
  id?: string | null;
}
