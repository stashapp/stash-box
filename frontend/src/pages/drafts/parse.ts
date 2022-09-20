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
  SceneFragment,
  PerformerFragment,
} from "src/graphql";
import { uniqBy } from "lodash-es";

type URL = { url: string; site: { id: string } };
const joinURLs = <T extends URL>(
  newURL: T | null,
  existingURLs: T[] | undefined
) =>
  uniqBy(
    [...(newURL ? [newURL] : []), ...(existingURLs ?? [])],
    (u) => `${u.url}-${u.site.id}`
  );

type Entity = { id: string };
const joinImages = <T extends Entity>(
  newImage: T | null,
  existingImages: T[] | undefined
) =>
  uniqBy(
    [...(newImage ? [newImage] : []), ...(existingImages ?? [])],
    (i) => i.id
  );

const joinTags = <T extends Entity>(
  newTags: T[] | null,
  existingTags: T[] | undefined
) => uniqBy([...(newTags ?? []), ...(existingTags ?? [])], (t) => t.id);

type Performer = { performer: { id: string }; as: string | null };
const joinPerformers = <T extends Performer>(
  newPerformers: T[] | null,
  existingPerformers: T[] | undefined
) => [
  ...(existingPerformers ?? []),
  ...(newPerformers ?? []).filter(
    (p) =>
      !(existingPerformers ?? []).some(
        (ep) => ep.performer.id === p.performer.id
      )
  ),
];

export const parseSceneDraft = (
  draft: SceneDraft,
  existingScene: SceneFragment | undefined
): [InitialScene, Record<string, string | null>] => {
  const scene: InitialScene = {
    date: draft.date,
    title: draft.title,
    details: draft.details,
    urls: joinURLs(draft.url, existingScene?.urls),
    studio: draft.studio?.__typename === "Studio" ? draft.studio : null,
    director: null,
    code: null,
    duration: draft.fingerprints?.[0].duration ?? null,
    images: draft.image ? [draft.image] : existingScene?.images,
    tags: joinTags(
      (draft.tags ?? []).reduce<Tag[]>(
        (res, t) => (t.__typename === "Tag" ? [...res, t] : res),
        []
      ),
      existingScene?.tags
    ),
    performers: joinPerformers(
      (draft.performers ?? []).reduce<ScenePerformer[]>(
        (res, p) =>
          p.__typename === "Performer"
            ? [
                ...res,
                { performer: p, as: "", __typename: "PerformerAppearance" },
              ]
            : res,
        []
      ),
      existingScene?.performers
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
  draft: PerformerDraft,
  existingPerformer: PerformerFragment | undefined
): [InitialPerformer, Record<string, string | null>] => {
  const performer: InitialPerformer = {
    name: draft.name,
    disambiguation: null,
    images: joinImages(draft.image, existingPerformer?.images),
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
    aliases: existingPerformer?.aliases,
    career_start_year: existingPerformer?.career_start_year,
    career_end_year: existingPerformer?.career_end_year,
    breast_type: existingPerformer?.breast_type,
    band_size: existingPerformer?.band_size,
    waist_size: existingPerformer?.waist_size,
    hip_size: existingPerformer?.hip_size,
    cup_size: existingPerformer?.cup_size,
    tattoos: existingPerformer?.tattoos ?? undefined,
    piercings: existingPerformer?.piercings ?? undefined,
    urls: existingPerformer?.urls,
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
