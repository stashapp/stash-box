import {
  Draft_findDraft_data_SceneDraft as SceneDraft,
  Draft_findDraft_data_PerformerDraft as PerformerDraft,
} from "src/graphql/definitions/Draft";
import {
  Scene_findScene as Scene,
  Scene_findScene_tags as Tag,
  Scene_findScene_performers as ScenePerformer,
} from "src/graphql/definitions/Scene";
import { Performer_findPerformer as Performer } from "src/graphql/definitions/Performer";
import {
  GenderEnum,
  HairColorEnum,
  EyeColorEnum,
  EthnicityEnum,
  DateAccuracyEnum,
} from "src/graphql";

export const parseSceneDraft = (
  draft: SceneDraft
): [Scene, Record<string, string | null>] => {
  const scene: Scene = {
    id: "",
    date: draft.date
      ? {
          date: draft.date,
          accuracy: DateAccuracyEnum.DAY,
          __typename: "FuzzyDate",
        }
      : null,
    title: draft.title,
    details: draft.details,
    urls: draft.url ? [draft.url] : [],
    studio: draft.studio?.__typename === "Studio" ? draft.studio : null,
    director: null,
    code: null,
    duration: draft.fingerprints?.[0].duration ?? null,
    images: draft.image ? [draft.image] : [],
    tags: (draft.tags ?? []).reduce<Tag[]>(
      (res, t) => (t.__typename === "Tag" ? [...res, t] : res),
      []
    ),
    fingerprints: [],
    performers: (draft.performers ?? []).reduce<ScenePerformer[]>(
      (res, p) =>
        p.__typename === "Performer"
          ? [
              ...res,
              { performer: p, as: "", __typename: "PerformerAppearance" },
            ]
          : res,
      []
    ),
    deleted: false,
    __typename: "Scene",
  };

  const remainder = {
    Studio:
      draft.studio?.__typename === "DraftEntity" ? draft.studio.name : null,
    Performers: (draft.performers ?? [])
      .reduce<string[]>(
        (res, p) => (p.__typename === "DraftEntity" ? [...res, p.name] : res),
        []
      )
      .join(", "),
    Tags: (draft.tags ?? [])
      .reduce<string[]>(
        (res, t) => (t.__typename === "DraftEntity" ? [...res, t.name] : res),
        []
      )
      .join(", "),
  };

  return [scene, remainder];
};

const parseEnum = (value: string | null, enumObj: Record<string, string>) =>
  Object.entries(enumObj).find(
    ([, objVal]) => value?.toLowerCase() === objVal.toLowerCase()
  )?.[0] ?? null;

export const parsePerformerDraft = (
  draft: PerformerDraft
): [Performer, Record<string, string | null>] => {
  const performer: Performer = {
    id: "",
    name: draft.name,
    disambiguation: null,
    images: draft.image ? [draft.image] : [],
    gender: parseEnum(draft.gender, GenderEnum) as GenderEnum | null,
    ethnicity: parseEnum(
      draft.ethnicity,
      EthnicityEnum
    ) as EthnicityEnum | null,
    eye_color: parseEnum(draft.eye_color, EyeColorEnum) as EyeColorEnum | null,
    hair_color: parseEnum(
      draft.hair_color,
      HairColorEnum
    ) as HairColorEnum | null,
    birthdate: draft.birthdate
      ? {
          date: draft.birthdate,
          accuracy: DateAccuracyEnum.DAY,
          __typename: "FuzzyDate",
        }
      : null,
    height: Number.parseInt(draft.height ?? "") || null,
    country: draft?.country?.length === 2 ? draft.country : null,
    deleted: false,
    aliases: [],
    age: null,
    career_start_year: null,
    career_end_year: null,
    breast_type: null,
    measurements: {
      band_size: null,
      waist: null,
      hip: null,
      cup_size: null,
      __typename: "Measurements",
    },
    tattoos: null,
    piercings: null,
    urls: [],
    is_favorite: false,
    __typename: "Performer",
  };

  const remainder = {
    Aliases: draft?.aliases,
    Height: draft.height && !performer.height ? draft.height : null,
    Country: draft?.country?.length !== 2 ? draft?.country : null,
    URLs: (draft?.urls ?? []).join(", "),
    Measurements: draft?.measurements,
    Piercings: draft?.piercings,
    Tattoos: draft?.tattoos,
  };

  return [performer, remainder];
};
