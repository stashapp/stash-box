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
  UserVotedFilterEnum,
  VoteStatusEnum,
  VoteTypeEnum,
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
  [HairColorEnum.BLOND]: "Blond",
  [HairColorEnum.BROWN]: "Brown",
  [HairColorEnum.GREY]: "Grey",
  [HairColorEnum.OTHER]: "Other",
  [HairColorEnum.RED]: "Red",
  [HairColorEnum.VARIOUS]: "Various",
  [HairColorEnum.WHITE]: "White",
};

export const GenderTypes: EnumDictionary<GenderEnum, string> = {
  [GenderEnum.MALE]: "Male",
  [GenderEnum.FEMALE]: "Female",
  [GenderEnum.INTERSEX]: "Intersex",
  [GenderEnum.NON_BINARY]: "Non-binary",
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
  [VoteStatusEnum.IMMEDIATE_ACCEPTED]: "Admin Accepted",
  [VoteStatusEnum.IMMEDIATE_REJECTED]: "Admin Rejected",
  [VoteStatusEnum.ACCEPTED]: "Accepted",
  [VoteStatusEnum.REJECTED]: "Rejected",
  [VoteStatusEnum.FAILED]: "Failed",
  [VoteStatusEnum.CANCELED]: "Cancelled",
};

export const VoteTypes: EnumDictionary<VoteTypeEnum, string> = {
  [VoteTypeEnum.ACCEPT]: "Yes",
  [VoteTypeEnum.IMMEDIATE_ACCEPT]: "Admin Accept",
  [VoteTypeEnum.IMMEDIATE_REJECT]: "Admin Reject",
  [VoteTypeEnum.ABSTAIN]: "Abstain",
  [VoteTypeEnum.REJECT]: "No",
};

export const UserVotedFilterTypes: EnumDictionary<UserVotedFilterEnum, string> =
  {
    [UserVotedFilterEnum.NOT_VOTED]: "Not Yet Voted",
    [UserVotedFilterEnum.ACCEPT]: "Yes",
    [UserVotedFilterEnum.ABSTAIN]: "Abstain",
    [UserVotedFilterEnum.REJECT]: "No",
  };
