import {
  BreastTypeEnum,
  EthnicityEnum,
  EthnicityFilterEnum,
  EyeColorEnum,
  HairColorEnum,
  GenderEnum,
  GenderFilterEnum,
  OperationEnum,
  TargetTypeEnum,
  VoteStatusEnum,
} from "src/graphql";

type EnumDictionary<T extends string | symbol | number, U> = {
  [K in T]: U;
};

export const BreastTypes: EnumDictionary<BreastTypeEnum, string> = {
  [BreastTypeEnum.NA]: "N/A",
  [BreastTypeEnum.FAKE]: "Augmented",
  [BreastTypeEnum.NATURAL]: "Natural",
};

export const EthnicityTypes: EnumDictionary<EthnicityEnum, string> = {
  [EthnicityEnum.ASIAN]: "Asian",
  [EthnicityEnum.BLACK]: "Black",
  [EthnicityEnum.LATIN]: "Latin",
  [EthnicityEnum.MIXED]: "Mixed",
  [EthnicityEnum.OTHER]: "Other",
  [EthnicityEnum.INDIAN]: "Indian",
  [EthnicityEnum.CAUCASIAN]: "Caucasian",
  [EthnicityEnum.MIDDLE_EASTERN]: "Middle Eastern",
};

export const EthnicityFilterTypes: EnumDictionary<EthnicityFilterEnum, string> =
  {
    ...EthnicityTypes,
    [EthnicityFilterEnum.UNKNOWN]: "Unknown Ethnicity",
  };

export const EyeColorTypes: EnumDictionary<EyeColorEnum, string> = {
  [EyeColorEnum.BLUE]: "Blue",
  [EyeColorEnum.BROWN]: "Brown",
  [EyeColorEnum.GREEN]: "Green",
  [EyeColorEnum.GREY]: "Grey",
  [EyeColorEnum.HAZEL]: "Hazel",
  [EyeColorEnum.RED]: "Red",
};

export const HairColorTypes: EnumDictionary<HairColorEnum, string> = {
  [HairColorEnum.AUBURN]: "Auburn",
  [HairColorEnum.BALD]: "Bald",
  [HairColorEnum.BLACK]: "Black",
  [HairColorEnum.BLONDE]: "Blonde",
  [HairColorEnum.BRUNETTE]: "Brunette",
  [HairColorEnum.GREY]: "Grey",
  [HairColorEnum.OTHER]: "Other",
  [HairColorEnum.RED]: "Red",
  [HairColorEnum.VARIOUS]: "Various",
};

export const GenderTypes: EnumDictionary<GenderEnum, string> = {
  [GenderEnum.MALE]: "Male",
  [GenderEnum.FEMALE]: "Female",
  [GenderEnum.INTERSEX]: "Intersex",
  [GenderEnum.TRANSGENDER_MALE]: "Transmale",
  [GenderEnum.TRANSGENDER_FEMALE]: "Transfemale",
};
export const GenderFilterTypes: EnumDictionary<GenderFilterEnum, string> = {
  ...GenderTypes,
  [GenderFilterEnum.UNKNOWN]: "Unknown Gender",
};

export const EditOperationTypes: EnumDictionary<OperationEnum, string> = {
  [OperationEnum.MERGE]: "Merge",
  [OperationEnum.CREATE]: "Create",
  [OperationEnum.MODIFY]: "Modify",
  [OperationEnum.DESTROY]: "Destroy",
};

export const EditTargetTypes: EnumDictionary<TargetTypeEnum, string> = {
  [TargetTypeEnum.TAG]: "Tag",
  [TargetTypeEnum.PERFORMER]: "Performer",
  [TargetTypeEnum.SCENE]: "Scene",
  [TargetTypeEnum.STUDIO]: "Studio",
};

export const EditStatusTypes: EnumDictionary<VoteStatusEnum, string> = {
  [VoteStatusEnum.PENDING]: "Pending",
  [VoteStatusEnum.IMMEDIATE_ACCEPTED]: "Approved",
  [VoteStatusEnum.IMMEDIATE_REJECTED]: "Cancelled",
  [VoteStatusEnum.ACCEPTED]: "Accepted",
  [VoteStatusEnum.REJECTED]: "Rejected",
};
