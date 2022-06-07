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

export enum EditSortEnum {
  CLOSED_AT = "CLOSED_AT",
  CREATED_AT = "CREATED_AT",
  UPDATED_AT = "UPDATED_AT",
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

export enum EthnicityFilterEnum {
  ASIAN = "ASIAN",
  BLACK = "BLACK",
  CAUCASIAN = "CAUCASIAN",
  INDIAN = "INDIAN",
  LATIN = "LATIN",
  MIDDLE_EASTERN = "MIDDLE_EASTERN",
  MIXED = "MIXED",
  OTHER = "OTHER",
  UNKNOWN = "UNKNOWN",
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
  OSHASH = "OSHASH",
  PHASH = "PHASH",
}

export enum GenderEnum {
  FEMALE = "FEMALE",
  INTERSEX = "INTERSEX",
  MALE = "MALE",
  TRANSGENDER_FEMALE = "TRANSGENDER_FEMALE",
  TRANSGENDER_MALE = "TRANSGENDER_MALE",
}

export enum GenderFilterEnum {
  FEMALE = "FEMALE",
  INTERSEX = "INTERSEX",
  MALE = "MALE",
  TRANSGENDER_FEMALE = "TRANSGENDER_FEMALE",
  TRANSGENDER_MALE = "TRANSGENDER_MALE",
  UNKNOWN = "UNKNOWN",
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

export enum OperationEnum {
  CREATE = "CREATE",
  DESTROY = "DESTROY",
  MERGE = "MERGE",
  MODIFY = "MODIFY",
}

export enum PerformerSortEnum {
  BIRTHDATE = "BIRTHDATE",
  CAREER_START_YEAR = "CAREER_START_YEAR",
  CREATED_AT = "CREATED_AT",
  DEBUT = "DEBUT",
  NAME = "NAME",
  SCENE_COUNT = "SCENE_COUNT",
  UPDATED_AT = "UPDATED_AT",
}

export enum RoleEnum {
  ADMIN = "ADMIN",
  BOT = "BOT",
  EDIT = "EDIT",
  INVITE = "INVITE",
  MANAGE_INVITES = "MANAGE_INVITES",
  MODIFY = "MODIFY",
  READ = "READ",
  VOTE = "VOTE",
}

export enum SceneSortEnum {
  CREATED_AT = "CREATED_AT",
  DATE = "DATE",
  TITLE = "TITLE",
  TRENDING = "TRENDING",
  UPDATED_AT = "UPDATED_AT",
}

export enum SortDirectionEnum {
  ASC = "ASC",
  DESC = "DESC",
}

export enum StudioSortEnum {
  CREATED_AT = "CREATED_AT",
  NAME = "NAME",
  UPDATED_AT = "UPDATED_AT",
}

export enum TagGroupEnum {
  ACTION = "ACTION",
  PEOPLE = "PEOPLE",
  SCENE = "SCENE",
}

export enum TagSortEnum {
  CREATED_AT = "CREATED_AT",
  NAME = "NAME",
  UPDATED_AT = "UPDATED_AT",
}

export enum TargetTypeEnum {
  PERFORMER = "PERFORMER",
  SCENE = "SCENE",
  STUDIO = "STUDIO",
  TAG = "TAG",
}

export enum ValidSiteTypeEnum {
  PERFORMER = "PERFORMER",
  SCENE = "SCENE",
  STUDIO = "STUDIO",
}

export enum VoteStatusEnum {
  ACCEPTED = "ACCEPTED",
  CANCELED = "CANCELED",
  FAILED = "FAILED",
  IMMEDIATE_ACCEPTED = "IMMEDIATE_ACCEPTED",
  IMMEDIATE_REJECTED = "IMMEDIATE_REJECTED",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
}

export enum VoteTypeEnum {
  ABSTAIN = "ABSTAIN",
  ACCEPT = "ACCEPT",
  IMMEDIATE_ACCEPT = "IMMEDIATE_ACCEPT",
  IMMEDIATE_REJECT = "IMMEDIATE_REJECT",
  REJECT = "REJECT",
}

export interface ActivateNewUserInput {
  name: string;
  email: string;
  activation_key: string;
  password: string;
}

export interface ApplyEditInput {
  id: string;
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

export interface CancelEditInput {
  id: string;
}

export interface DateCriterionInput {
  value: GQLDate;
  modifier: CriterionModifier;
}

export interface EditCommentInput {
  id: string;
  comment: string;
}

export interface EditInput {
  id?: string | null;
  operation: OperationEnum;
  merge_source_ids?: string[] | null;
  comment?: string | null;
}

export interface EditQueryInput {
  user_id?: string | null;
  status?: VoteStatusEnum | null;
  operation?: OperationEnum | null;
  vote_count?: IntCriterionInput | null;
  applied?: boolean | null;
  target_type?: TargetTypeEnum | null;
  target_id?: string | null;
  is_favorite?: boolean | null;
  page: number;
  per_page: number;
  direction: SortDirectionEnum;
  sort: EditSortEnum;
}

export interface EditVoteInput {
  id: string;
  vote: VoteTypeEnum;
}

export interface EyeColorCriterionInput {
  value?: EyeColorEnum | null;
  modifier: CriterionModifier;
}

export interface FingerprintEditInput {
  user_ids?: string[] | null;
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
  created: GQLTime;
  submissions?: number | null;
  updated?: GQLTime | null;
}

export interface FingerprintInput {
  user_ids?: string[] | null;
  hash: string;
  algorithm: FingerprintAlgorithm;
  duration: number;
}

export interface GrantInviteInput {
  user_id: string;
  amount: number;
}

export interface HairColorCriterionInput {
  value?: HairColorEnum | null;
  modifier: CriterionModifier;
}

export interface IDCriterionInput {
  value: string[];
  modifier: CriterionModifier;
}

export interface ImageCreateInput {
  url?: string | null;
  file?: GQLUpload | null;
}

export interface IntCriterionInput {
  value: number;
  modifier: CriterionModifier;
}

export interface MultiIDCriterionInput {
  value?: string[] | null;
  modifier: CriterionModifier;
}

export interface MultiStringCriterionInput {
  value: string[];
  modifier: CriterionModifier;
}

export interface NewUserInput {
  email: string;
  invite_key?: string | null;
}

export interface PerformerAppearanceInput {
  performer_id: string;
  as?: string | null;
}

export interface PerformerEditDetailsInput {
  name?: string | null;
  disambiguation?: string | null;
  aliases?: string[] | null;
  gender?: GenderEnum | null;
  urls?: URLInput[] | null;
  birthdate?: string | null;
  ethnicity?: EthnicityEnum | null;
  country?: string | null;
  eye_color?: EyeColorEnum | null;
  hair_color?: HairColorEnum | null;
  height?: number | null;
  cup_size?: string | null;
  band_size?: number | null;
  waist_size?: number | null;
  hip_size?: number | null;
  breast_type?: BreastTypeEnum | null;
  career_start_year?: number | null;
  career_end_year?: number | null;
  tattoos?: BodyModificationInput[] | null;
  piercings?: BodyModificationInput[] | null;
  image_ids?: string[] | null;
  draft_id?: string | null;
}

export interface PerformerEditInput {
  edit: EditInput;
  details?: PerformerEditDetailsInput | null;
  options?: PerformerEditOptionsInput | null;
}

export interface PerformerEditOptionsInput {
  set_modify_aliases?: boolean | null;
  set_merge_aliases?: boolean | null;
}

export interface PerformerQueryInput {
  names?: string | null;
  name?: string | null;
  alias?: string | null;
  disambiguation?: StringCriterionInput | null;
  gender?: GenderFilterEnum | null;
  url?: string | null;
  birthdate?: DateCriterionInput | null;
  birth_year?: IntCriterionInput | null;
  age?: IntCriterionInput | null;
  ethnicity?: EthnicityFilterEnum | null;
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
  is_favorite?: boolean | null;
  page: number;
  per_page: number;
  direction: SortDirectionEnum;
  sort: PerformerSortEnum;
}

export interface ResetPasswordInput {
  email: string;
}

export interface RevokeInviteInput {
  user_id: string;
  amount: number;
}

export interface RoleCriterionInput {
  value: RoleEnum[];
  modifier: CriterionModifier;
}

export interface SceneCreateInput {
  title?: string | null;
  details?: string | null;
  urls?: URLInput[] | null;
  date: string;
  studio_id?: string | null;
  performers?: PerformerAppearanceInput[] | null;
  tag_ids?: string[] | null;
  image_ids?: string[] | null;
  fingerprints: FingerprintEditInput[];
  duration?: number | null;
  director?: string | null;
  code?: string | null;
}

export interface SceneDestroyInput {
  id: string;
}

export interface SceneEditDetailsInput {
  title?: string | null;
  details?: string | null;
  urls?: URLInput[] | null;
  date?: string | null;
  studio_id?: string | null;
  performers?: PerformerAppearanceInput[] | null;
  tag_ids?: string[] | null;
  image_ids?: string[] | null;
  duration?: number | null;
  director?: string | null;
  code?: string | null;
  fingerprints?: FingerprintInput[] | null;
  draft_id?: string | null;
}

export interface SceneEditInput {
  edit: EditInput;
  details?: SceneEditDetailsInput | null;
}

export interface SceneQueryInput {
  text?: string | null;
  title?: string | null;
  url?: string | null;
  date?: DateCriterionInput | null;
  studios?: MultiIDCriterionInput | null;
  parentStudio?: string | null;
  tags?: MultiIDCriterionInput | null;
  performers?: MultiIDCriterionInput | null;
  alias?: StringCriterionInput | null;
  fingerprints?: MultiStringCriterionInput | null;
  page: number;
  per_page: number;
  direction: SortDirectionEnum;
  sort: SceneSortEnum;
}

export interface SceneUpdateInput {
  id: string;
  title?: string | null;
  details?: string | null;
  urls?: URLInput[] | null;
  date?: string | null;
  studio_id?: string | null;
  performers?: PerformerAppearanceInput[] | null;
  tag_ids?: string[] | null;
  image_ids?: string[] | null;
  fingerprints?: FingerprintEditInput[] | null;
  duration?: number | null;
  director?: string | null;
  code?: string | null;
}

export interface SiteCreateInput {
  name: string;
  description?: string | null;
  url?: string | null;
  regex?: string | null;
  valid_types: ValidSiteTypeEnum[];
}

export interface SiteDestroyInput {
  id: string;
}

export interface SiteUpdateInput {
  id: string;
  name: string;
  description?: string | null;
  url?: string | null;
  regex?: string | null;
  valid_types: ValidSiteTypeEnum[];
}

export interface StringCriterionInput {
  value: string;
  modifier: CriterionModifier;
}

export interface StudioCreateInput {
  name: string;
  urls?: URLInput[] | null;
  parent_id?: string | null;
  image_ids?: string[] | null;
}

export interface StudioDestroyInput {
  id: string;
}

export interface StudioEditDetailsInput {
  name?: string | null;
  urls?: URLInput[] | null;
  parent_id?: string | null;
  image_ids?: string[] | null;
}

export interface StudioEditInput {
  edit: EditInput;
  details?: StudioEditDetailsInput | null;
}

export interface StudioQueryInput {
  name?: string | null;
  names?: string | null;
  url?: string | null;
  parent?: IDCriterionInput | null;
  has_parent?: boolean | null;
  is_favorite?: boolean | null;
  page: number;
  per_page: number;
  direction: SortDirectionEnum;
  sort: StudioSortEnum;
}

export interface StudioUpdateInput {
  id: string;
  name?: string | null;
  urls?: URLInput[] | null;
  parent_id?: string | null;
  image_ids?: string[] | null;
}

export interface TagCategoryCreateInput {
  name: string;
  group: TagGroupEnum;
  description?: string | null;
}

export interface TagCategoryDestroyInput {
  id: string;
}

export interface TagCategoryUpdateInput {
  id: string;
  name?: string | null;
  group?: TagGroupEnum | null;
  description?: string | null;
}

export interface TagEditDetailsInput {
  name?: string | null;
  description?: string | null;
  aliases?: string[] | null;
  category_id?: string | null;
}

export interface TagEditInput {
  edit: EditInput;
  details?: TagEditDetailsInput | null;
}

export interface TagQueryInput {
  text?: string | null;
  names?: string | null;
  name?: string | null;
  category_id?: string | null;
  page: number;
  per_page: number;
  direction: SortDirectionEnum;
  sort: TagSortEnum;
}

export interface URLInput {
  url: string;
  site_id: string;
}

export interface UserChangePasswordInput {
  existing_password?: string | null;
  new_password: string;
  reset_key?: string | null;
}

export interface UserCreateInput {
  name: string;
  password: string;
  roles: RoleEnum[];
  email: string;
  invited_by_id?: string | null;
}

export interface UserDestroyInput {
  id: string;
}

export interface UserQueryInput {
  name?: string | null;
  email?: string | null;
  roles?: RoleCriterionInput | null;
  apiKey?: string | null;
  successful_edits?: IntCriterionInput | null;
  unsuccessful_edits?: IntCriterionInput | null;
  successful_votes?: IntCriterionInput | null;
  unsuccessful_votes?: IntCriterionInput | null;
  api_calls?: IntCriterionInput | null;
  invited_by?: string | null;
  page: number;
  per_page: number;
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
