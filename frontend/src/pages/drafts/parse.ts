import {
  Draft_findDraft_data_SceneDraft as SceneDraft,
  Draft_findDraft_data_PerformerDraft as PerformerDraft,
} from "src/graphql/definitions/Draft";
import {
  Scene_findScene_tags as Tag,
  Scene_findScene_performers as ScenePerformer,
} from "src/graphql/definitions/Scene";
import { InitialScene } from "src/pages/scenes/sceneForm";
import { InitialPerformer } from "src/pages/performers/performerForm";
import {
  GenderEnum,
  HairColorEnum,
  EyeColorEnum,
  EthnicityEnum,
} from "src/graphql";

export const parseSceneDraft = (
  draft: SceneDraft
): [InitialScene, Record<string, string | null>] => {
  const scene: InitialScene = {
    date: draft.date,
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
): [InitialPerformer, Record<string, string | null>] => {
  const performer: InitialPerformer = {
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
    birthdate: draft.birthdate,
    height: Number.parseInt(draft.height ?? "") || null,
    country: draft?.country?.length === 2 ? draft.country : null,
    aliases: [],
    career_start_year: null,
    career_end_year: null,
    breast_type: null,
    measurements: {
      band_size: null,
      waist: null,
      hip: null,
      cup_size: null,
    },
    tattoos: [],
    piercings: [],
    urls: [],
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
