import {
  BreastTypeEnum,
  FingerprintAlgorithm,
  EthnicityEnum,
  GenderEnum,
  NotificationEnum,
} from "src/graphql";

export const genderEnum = (
  gender: string | undefined | null,
): GenderEnum | null =>
  gender === "MALE"
    ? GenderEnum.MALE
    : gender === "FEMALE"
      ? GenderEnum.FEMALE
      : gender === "NON_BINARY"
        ? GenderEnum.NON_BINARY
        : gender === "TRANSGENDER_MALE"
          ? GenderEnum.TRANSGENDER_MALE
          : gender === "TRANSGENDER_FEMALE"
            ? GenderEnum.TRANSGENDER_FEMALE
            : gender === "INTERSEX"
              ? GenderEnum.INTERSEX
              : null;

export const ethnicityEnum = (
  ethnicity: string | undefined | null,
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
  algorithm: string | undefined | null,
): FingerprintAlgorithm | null =>
  algorithm === "MD5"
    ? FingerprintAlgorithm.MD5
    : algorithm === "OSHASH"
      ? FingerprintAlgorithm.OSHASH
      : algorithm === "PHASH"
        ? FingerprintAlgorithm.PHASH
        : null;

export const breastType = (
  type: string | undefined | null,
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

export const ensureEnum = <T>(enm: { [s: string]: T }, value: string): T =>
  (Object.values(enm) as unknown as string[]).includes(value.toUpperCase())
    ? (value.toUpperCase() as unknown as T)
    : Object.values(enm)[0];

export const resolveEnum = <T>(
  enm: { [s: string]: T },
  value: string | null,
  defaultValue?: T,
): T | undefined =>
  value &&
  (Object.values(enm) as unknown as string[]).includes(value.toUpperCase())
    ? (value.toUpperCase() as unknown as T)
    : defaultValue;

type NotificationEnumMap = { [key in NotificationEnum]: string };
export const NotificationType: NotificationEnumMap = {
  [NotificationEnum.UPDATED_EDIT]: "Updates to an edit you have voted on.",
  [NotificationEnum.COMMENT_OWN_EDIT]: "Comments on one of your edits",
  [NotificationEnum.DOWNVOTE_OWN_EDIT]: "Downvotes on one of your edits",
  [NotificationEnum.FAILED_OWN_EDIT]: "One of your edits have failed",
  [NotificationEnum.COMMENT_COMMENTED_EDIT]:
    "Comments on edits you have commented on",
  [NotificationEnum.COMMENT_VOTED_EDIT]: "Comments on edits you have voted on",
  [NotificationEnum.FAVORITE_PERFORMER_EDIT]:
    "An edit to a performer you have favorited, or a scene involving them.",
  [NotificationEnum.FAVORITE_STUDIO_EDIT]:
    "An edit to a studio you have favorited, or a scene from that studio.",
  [NotificationEnum.FAVORITE_STUDIO_SCENE]:
    "A new scene from a studio you have favorited.",
  [NotificationEnum.FAVORITE_PERFORMER_SCENE]:
    "A new scene involving a performer you have favorited.",
  [NotificationEnum.FINGERPRINTED_SCENE_EDIT]:
    "An edit to a scene you have submitted fingerprints for.",
};
