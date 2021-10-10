import { FingerprintAlgorithm, GenderEnum } from "src/graphql";

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
