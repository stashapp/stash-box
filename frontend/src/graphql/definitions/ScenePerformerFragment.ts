/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum } from "./globalTypes";

// ====================================================
// GraphQL fragment: ScenePerformerFragment
// ====================================================

export interface ScenePerformerFragment {
  __typename: "Performer";
  id: string;
  name: string;
  disambiguation: string | null;
  deleted: boolean;
  gender: GenderEnum | null;
  aliases: string[];
}
