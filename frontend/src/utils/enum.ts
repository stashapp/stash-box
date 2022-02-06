import {
  BreastTypeEnum,
  FingerprintAlgorithm,
  EthnicityEnum,
  GenderEnum,
} from "src/graphql";

export const genderEnum = (
  gender: string | undefined | null
): GenderEnum | null =>
  gender === "MALE"
    ? GenderEnum.MALE
    : gender === "FEMALE"
    ? GenderEnum.FEMALE
    : gender === "TRANSGENDER_MALE"
    ? GenderEnum.TRANSGENDER_MALE
    : gender === "TRANSGENDER_FEMALE"
    ? GenderEnum.TRANSGENDER_FEMALE
    : gender === "INTERSEX"
    ? GenderEnum.INTERSEX
    : null;

export const ethnicityEnum = (
  ethnicity: string | undefined | null
): EthnicityEnum | null => {
  switch (ethnicity) {
    case "ASIAN":
      return EthnicityEnum.ASIAN;
    case "BLACK":
      return EthnicityEnum.BLACK;
    case "CAUCASIAN":
      return EthnicityEnum.CAUCASIAN;
    case "INDIAN":
      return EthnicityEnum.INDIAN;
    case "LATIN":
      return EthnicityEnum.LATIN;
    case "MIDDLE_EASTERN":
      return EthnicityEnum.MIDDLE_EASTERN;
    case "MIXED":
      return EthnicityEnum.MIXED;
    case "OTHER":
      return EthnicityEnum.OTHER;
    default:
      return null;
  }
};

export const fingerprintAlgorithm = (
  algorithm: string | undefined | null
): FingerprintAlgorithm | null =>
  algorithm === "MD5"
    ? FingerprintAlgorithm.MD5
    : algorithm === "OSHASH"
    ? FingerprintAlgorithm.OSHASH
    : algorithm === "PHASH"
    ? FingerprintAlgorithm.PHASH
    : null;

export const breastType = (
  type: string | undefined | null
): BreastTypeEnum | null => {
  switch (type) {
    case "FAKE":
      return BreastTypeEnum.FAKE;
    case "NA":
      return BreastTypeEnum.NA;
    case "NATURAL":
      return BreastTypeEnum.NATURAL;
    default:
      return null;
  }
};

export const resolveEnum = <T>(
  enm: { [s: string]: T },
  value: string | null,
  defaultValue?: T
): T | undefined =>
  value &&
  (Object.values(enm) as unknown as string[]).includes(value.toUpperCase())
    ? (value.toUpperCase() as unknown as T)
    : defaultValue;
