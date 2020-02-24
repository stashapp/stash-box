/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export enum BreastTypeEnum {
  FAKE = "FAKE",
  NA = "NA",
  NATURAL = "NATURAL",
}

export enum CriterionModifier {
  EQUALS = "EQUALS",
  EXCLUDES = "EXCLUDES",
  GREATER_THAN = "GREATER_THAN",
  INCLUDES = "INCLUDES",
  INCLUDES_ALL = "INCLUDES_ALL",
  IS_NULL = "IS_NULL",
  LESS_THAN = "LESS_THAN",
  NOT_EQUALS = "NOT_EQUALS",
  NOT_NULL = "NOT_NULL",
}

export enum DateAccuracyEnum {
  DAY = "DAY",
  MONTH = "MONTH",
  YEAR = "YEAR",
}

export enum EthnicityEnum {
  ASIAN = "ASIAN",
  BLACK = "BLACK",
  CAUCASIAN = "CAUCASIAN",
  INDIAN = "INDIAN",
  LATIN = "LATIN",
  MIDDLE_EASTERN = "MIDDLE_EASTERN",
  MIXED = "MIXED",
  OTHER = "OTHER",
}

export enum EyeColorEnum {
  BLUE = "BLUE",
  BROWN = "BROWN",
  GREEN = "GREEN",
  GREY = "GREY",
  HAZEL = "HAZEL",
  RED = "RED",
}

export enum FingerprintAlgorithm {
  MD5 = "MD5",
}

export enum GenderEnum {
  FEMALE = "FEMALE",
  INTERSEX = "INTERSEX",
  MALE = "MALE",
  TRANSGENDER_FEMALE = "TRANSGENDER_FEMALE",
  TRANSGENDER_MALE = "TRANSGENDER_MALE",
}

export enum HairColorEnum {
  AUBURN = "AUBURN",
  BALD = "BALD",
  BLACK = "BLACK",
  BLONDE = "BLONDE",
  BRUNETTE = "BRUNETTE",
  GREY = "GREY",
  OTHER = "OTHER",
  RED = "RED",
  VARIOUS = "VARIOUS",
}

export enum RoleEnum {
  ADMIN = "ADMIN",
  EDIT = "EDIT",
  MODIFY = "MODIFY",
  READ = "READ",
  VOTE = "VOTE",
}

export enum SortDirectionEnum {
  ASC = "ASC",
  DESC = "DESC",
}

export interface BodyModificationCriterionInput {
  location?: string | null;
  description?: string | null;
  modifier: CriterionModifier;
}

export interface BodyModificationInput {
  location: string;
  description?: string | null;
}

export interface BreastTypeCriterionInput {
  value?: BreastTypeEnum | null;
  modifier: CriterionModifier;
}

export interface DateCriterionInput {
  value: any;
  modifier: CriterionModifier;
}

export interface EthnicityCriterionInput {
  value?: EthnicityEnum | null;
  modifier: CriterionModifier;
}

export interface EyeColorCriterionInput {
  value?: EyeColorEnum | null;
  modifier: CriterionModifier;
}

export interface FingerprintInput {
  hash: string;
  algorithm: FingerprintAlgorithm;
}

export interface FuzzyDateInput {
  date: any;
  accuracy: DateAccuracyEnum;
}

export interface HairColorCriterionInput {
  value?: HairColorEnum | null;
  modifier: CriterionModifier;
}

export interface IDCriterionInput {
  value: string[];
  modifier: CriterionModifier;
}

export interface IntCriterionInput {
  value: number;
  modifier: CriterionModifier;
}

export interface MeasurementsInput {
  cup_size?: string | null;
  band_size?: number | null;
  waist?: number | null;
  hip?: number | null;
}

export interface MultiIDCriterionInput {
  value?: string[] | null;
  modifier: CriterionModifier;
}

export interface PerformerAppearanceInput {
  performer_id: string;
  as?: string | null;
}

export interface PerformerCreateInput {
  name: string;
  disambiguation?: string | null;
  aliases?: string[] | null;
  gender?: GenderEnum | null;
  urls?: URLInput[] | null;
  birthdate?: FuzzyDateInput | null;
  ethnicity?: EthnicityEnum | null;
  country?: string | null;
  eye_color?: EyeColorEnum | null;
  hair_color?: HairColorEnum | null;
  height?: number | null;
  measurements?: MeasurementsInput | null;
  breast_type?: BreastTypeEnum | null;
  career_start_year?: number | null;
  career_end_year?: number | null;
  tattoos?: BodyModificationInput[] | null;
  piercings?: BodyModificationInput[] | null;
}

export interface PerformerDestroyInput {
  id: string;
}

export interface PerformerFilterType {
  names?: string | null;
  name?: string | null;
  alias?: string | null;
  disambiguation?: StringCriterionInput | null;
  gender?: GenderEnum | null;
  url?: string | null;
  birthdate?: DateCriterionInput | null;
  birth_year?: IntCriterionInput | null;
  age?: IntCriterionInput | null;
  ethnicity?: EthnicityCriterionInput | null;
  country?: StringCriterionInput | null;
  eye_color?: EyeColorCriterionInput | null;
  hair_color?: HairColorCriterionInput | null;
  height?: IntCriterionInput | null;
  cup_size?: StringCriterionInput | null;
  band_size?: IntCriterionInput | null;
  waist_size?: IntCriterionInput | null;
  hip_size?: IntCriterionInput | null;
  breast_type?: BreastTypeCriterionInput | null;
  career_start_year?: IntCriterionInput | null;
  career_end_year?: IntCriterionInput | null;
  tattoos?: BodyModificationCriterionInput | null;
  piercings?: BodyModificationCriterionInput | null;
}

export interface PerformerUpdateInput {
  id: string;
  name?: string | null;
  disambiguation?: string | null;
  aliases?: string[] | null;
  gender?: GenderEnum | null;
  urls?: URLInput[] | null;
  birthdate?: FuzzyDateInput | null;
  ethnicity?: EthnicityEnum | null;
  country?: string | null;
  eye_color?: EyeColorEnum | null;
  hair_color?: HairColorEnum | null;
  height?: number | null;
  measurements?: MeasurementsInput | null;
  breast_type?: BreastTypeEnum | null;
  career_start_year?: number | null;
  career_end_year?: number | null;
  tattoos?: BodyModificationInput[] | null;
  piercings?: BodyModificationInput[] | null;
}

export interface QuerySpec {
  page?: number | null;
  per_page?: number | null;
  sort?: string | null;
  direction?: SortDirectionEnum | null;
}

export interface SceneCreateInput {
  title?: string | null;
  details?: string | null;
  urls?: URLInput[] | null;
  date?: any | null;
  studio_id?: string | null;
  performers?: PerformerAppearanceInput[] | null;
  tag_ids?: string[] | null;
  fingerprints: FingerprintInput[];
  duration?: number | null;
}

export interface SceneDestroyInput {
  id: string;
}

export interface SceneFilterType {
  text?: string | null;
  title?: string | null;
  url?: string | null;
  date?: DateCriterionInput | null;
  studios?: MultiIDCriterionInput | null;
  tags?: MultiIDCriterionInput | null;
  performers?: MultiIDCriterionInput | null;
  alias?: StringCriterionInput | null;
}

export interface SceneUpdateInput {
  id: string;
  title?: string | null;
  details?: string | null;
  urls?: URLInput[] | null;
  date?: any | null;
  studio_id?: string | null;
  performers?: PerformerAppearanceInput[] | null;
  tag_ids?: string[] | null;
  fingerprints?: FingerprintInput[] | null;
  duration?: number | null;
}

export interface StringCriterionInput {
  value: string;
  modifier: CriterionModifier;
}

export interface StudioCreateInput {
  name: string;
  urls?: URLInput[] | null;
  parent_id?: string | null;
  child_studio_ids?: string[] | null;
}

export interface StudioFilterType {
  name?: string | null;
  url?: string | null;
  parent?: IDCriterionInput | null;
}

export interface StudioUpdateInput {
  id: string;
  name?: string | null;
  urls?: URLInput[] | null;
  parent_id?: string | null;
  child_studio_ids?: string[] | null;
}

export interface URLInput {
  url: string;
  type: string;
}

export interface UserChangePasswordInput {
  existing_password: string;
  new_password: string;
}

export interface UserCreateInput {
  name: string;
  password: string;
  roles: RoleEnum[];
  email: string;
}

export interface UserDestroyInput {
  id: string;
}

export interface UserUpdateInput {
  id: string;
  name?: string | null;
  password?: string | null;
  roles?: RoleEnum[] | null;
  email?: string | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
