/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: FavoritePerformer
// ====================================================

export interface FavoritePerformer {
  /**
   * Favorite or unfavorite a performer
   */
  favoritePerformer: boolean;
}

export interface FavoritePerformerVariables {
  id: string;
  favorite: boolean;
}
