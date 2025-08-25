import type {
  GenderEnum,
  HairColorEnum,
  EyeColorEnum,
  EthnicityEnum,
  BreastTypeEnum,
} from "src/graphql";

export type InitialPerformer = {
  name?: string | null;
  disambiguation?: string | null;
  gender?: GenderEnum | null;
  birthdate?: string | null;
  deathdate?: string | null;
  height?: number | null;
  hair_color?: HairColorEnum | null;
  eye_color?: EyeColorEnum | null;
  ethnicity?: EthnicityEnum | null;
  breast_type?: BreastTypeEnum | null;
  country?: string | null;
  career_start_year?: number | null;
  career_end_year?: number | null;
  urls?: {
    url: string;
    site: {
      id: string;
      name: string;
    };
  }[];
  aliases?: string[];
  waist_size?: number | null;
  hip_size?: number | null;
  band_size?: number | null;
  cup_size?: string | null;
  images?: {
    id: string;
    url: string;
    width: number;
    height: number;
  }[];
  tattoos?: {
    location: string;
    description?: string | null;
  }[];
  piercings?: {
    location: string;
    description?: string | null;
  }[];
};
