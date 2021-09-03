/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { GenderEnum, EthnicityEnum, EyeColorEnum, HairColorEnum, BreastTypeEnum } from "./globalTypes";

// ====================================================
// GraphQL fragment: PerformerEditFragment
// ====================================================

export interface PerformerEditFragment_added_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface PerformerEditFragment_removed_urls {
  __typename: "URL";
  url: string;
  type: string;
}

export interface PerformerEditFragment_added_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface PerformerEditFragment_removed_tattoos {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface PerformerEditFragment_added_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface PerformerEditFragment_removed_piercings {
  __typename: "BodyModification";
  location: string;
  description: string | null;
}

export interface PerformerEditFragment_added_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface PerformerEditFragment_removed_images {
  __typename: "Image";
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface PerformerEditFragment {
  __typename: "PerformerEdit";
  name: string | null;
  disambiguation: string | null;
  added_aliases: string[] | null;
  removed_aliases: string[] | null;
  gender: GenderEnum | null;
  added_urls: PerformerEditFragment_added_urls[] | null;
  removed_urls: PerformerEditFragment_removed_urls[] | null;
  birthdate: string | null;
  birthdate_accuracy: string | null;
  ethnicity: EthnicityEnum | null;
  country: string | null;
  eye_color: EyeColorEnum | null;
  hair_color: HairColorEnum | null;
  /**
   * Height in cm
   */
  height: number | null;
  cup_size: string | null;
  band_size: number | null;
  waist_size: number | null;
  hip_size: number | null;
  breast_type: BreastTypeEnum | null;
  career_start_year: number | null;
  career_end_year: number | null;
  added_tattoos: PerformerEditFragment_added_tattoos[] | null;
  removed_tattoos: PerformerEditFragment_removed_tattoos[] | null;
  added_piercings: PerformerEditFragment_added_piercings[] | null;
  removed_piercings: PerformerEditFragment_removed_piercings[] | null;
  added_images: (PerformerEditFragment_added_images | null)[] | null;
  removed_images: (PerformerEditFragment_removed_images | null)[] | null;
}
