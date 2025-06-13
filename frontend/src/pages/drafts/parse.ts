import { InitialScene } from "src/pages/scenes/sceneForm";
import { InitialPerformer } from "src/pages/performers/performerForm";
import {
  GenderEnum,
  HairColorEnum,
  EyeColorEnum,
  EthnicityEnum,
  SceneFragment,
  PerformerFragment,
  DraftQuery,
  SceneQuery,
  BreastTypeEnum,
  ValidSiteTypeEnum,
  Site,
} from "src/graphql";
import { uniqBy } from "lodash-es";

import { cleanURL } from "src/utils";

type DraftData = NonNullable<DraftQuery["findDraft"]>["data"];
type SceneDraft = DraftData & { __typename: "SceneDraft" };
type PerformerDraft = DraftData & { __typename: "PerformerDraft" };
type Tag = NonNullable<SceneQuery["findScene"]>["tags"][number];
type ScenePerformer = NonNullable<
  SceneQuery["findScene"]
>["performers"][number];

type URL = { url: string; site: { id: string; name: string; icon: string } };
const joinURLs = <T extends URL>(
  newURLs: T[] | undefined | null,
  existingURLs: T[] | undefined,
) =>
  uniqBy(
    [...(newURLs ? newURLs : []), ...(existingURLs ?? [])],
    (u) => `${u.url}-${u.site.id}`,
  );

type Entity = { id: string };
const joinImages = <T extends Entity>(
  newImage: T | null | undefined,
  existingImages: T[] | undefined,
) =>
  uniqBy(
    [...(newImage ? [newImage] : []), ...(existingImages ?? [])],
    (i) => i.id,
  );

const joinTags = <T extends Entity>(
  newTags: T[] | null,
  existingTags: T[] | undefined,
) => uniqBy([...(newTags ?? []), ...(existingTags ?? [])], (t) => t.id);

type Performer = { performer: { id: string }; as?: string | null };
const joinPerformers = <T extends Performer>(
  newPerformers: T[] | null,
  existingPerformers: T[] | undefined,
) => [
  ...(existingPerformers ?? []),
  ...(newPerformers ?? []).filter(
    (p) =>
      !(existingPerformers ?? []).some(
        (ep) => ep.performer.id === p.performer.id,
      ),
  ),
];

const parseUrls = (
  urls: string[],
  type: ValidSiteTypeEnum,
  sites: Site[],
): [URL[], string[]] => {
  const matches = [];
  const remainder = [];

  for (const url of urls) {
    if (url == "") continue;

    const matchedSite = sites.find((site) => {
      if (!site.valid_types.includes(type) || !site.regex) return false;

      return Boolean(url.match(site.regex));
    });

    if (matchedSite)
      matches.push({
        url: cleanURL(matchedSite.regex, url) ?? url,
        site: matchedSite,
      });
    else remainder.push(url);
  }
  return [matches, remainder];
};

const parseSceneUrls = (
  urls: string[],
  type: ValidSiteTypeEnum,
  sites: Site[],
): [URL[], string[]] => {
  const [matches, remainder] = parseUrls(urls, type, sites);

  // Fall back to studio URL if there's only one unmatched URL
  if (remainder.length === 1) {
    const studio = sites.find((site) => site.name === "Studio");
    if (studio) {
      matches.push({ url: remainder[0], site: studio });
      return [matches, []];
    }
  }

  return [matches, remainder];
};

export const parseSceneDraft = (
  draft: SceneDraft,
  existingScene: SceneFragment | undefined,
  sites: Site[],
): [InitialScene, Record<string, string | null>] => {
  const [mappedUrls, remainingUrls] = parseSceneUrls(
    draft?.urls ?? [],
    ValidSiteTypeEnum.SCENE,
    sites,
  );

  const scene: InitialScene = {
    date: draft.date,
    title: draft.title,
    details: draft.details,
    urls: joinURLs(mappedUrls, existingScene?.urls),
    studio: draft.studio?.__typename === "Studio" ? draft.studio : null,
    director: draft.director,
    code: draft.code,
    duration: draft.fingerprints?.[0]?.duration ?? null,
    images: draft.image ? [draft.image] : existingScene?.images,
    tags: joinTags(
      (draft.tags ?? []).reduce<Tag[]>(
        (res, t) => (t.__typename === "Tag" ? [...res, t] : res),
        [],
      ),
      existingScene?.tags,
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
        [],
      ),
      existingScene?.performers,
    ),
  };

  const remainder = {
    Studio:
      draft.studio?.__typename === "DraftEntity" ? draft.studio.name : null,
    Performers: (draft.performers ?? [])
      .reduce<
        string[]
      >((res, p) => (p.__typename === "DraftEntity" ? [...res, p.name] : res), [])
      .join(", "),
    Urls: remainingUrls.join(", "),
    Tags: (draft.tags ?? [])
      .reduce<
        string[]
      >((res, t) => (t.__typename === "DraftEntity" ? [...res, t.name] : res), [])
      .join(", "),
  };

  return [scene, remainder];
};

const parseEnum = (
  value: string | null | undefined,
  enumObj: Record<string, string>,
) =>
  Object.entries(enumObj).find(
    ([, objVal]) => value?.toLowerCase() === objVal.toLowerCase(),
  )?.[0] ?? null;

const parseBreastType = (value: string | null | undefined) => {
  switch (value?.toLocaleUpperCase()) {
    case "FAKE":
    case "AUGMENTED":
      return BreastTypeEnum.FAKE;
    case "NATURAL":
      return BreastTypeEnum.NATURAL;
    default:
      return null;
  }
};

const parseMeasurements = (value: string | null | undefined) => {
  const parsedMeasurements = value?.match(
    /^(\d\d)([a-zA-Z]+)(?:-|\s)(\d\d)(?:-|\s)(\d\d)$/,
  );
  if (!parsedMeasurements || parsedMeasurements?.length != 5) return null;

  return {
    band: Number.parseInt(parsedMeasurements[1]),
    cup: parsedMeasurements[2],
    waist: Number.parseInt(parsedMeasurements[3]),
    hip: Number.parseInt(parsedMeasurements[4]),
  };
};

const parseAliases = (value: string | null | undefined) => {
  if (!value) return null;

  const aliases = value?.split(",").map((alias) => alias.trim());
  if (aliases.length > 0) return aliases;
  return null;
};

export const parsePerformerDraft = (
  draft: PerformerDraft,
  existingPerformer: PerformerFragment | undefined,
  sites: Site[],
): [InitialPerformer, Record<string, string | null>] => {
  const measurements = parseMeasurements(draft?.measurements);
  const draftAliases = parseAliases(draft?.aliases);
  const [mappedUrls, remainingUrls] = parseUrls(
    draft?.urls ?? [],
    ValidSiteTypeEnum.PERFORMER,
    sites,
  );

  const performer: InitialPerformer = {
    name: draft.name,
    disambiguation: draft.disambiguation ?? null,
    images: joinImages(draft.image, existingPerformer?.images),
    gender: parseEnum(draft.gender, GenderEnum) as GenderEnum | null,
    ethnicity: parseEnum(
      draft.ethnicity,
      EthnicityEnum,
    ) as EthnicityEnum | null,
    eye_color: parseEnum(draft.eye_color, EyeColorEnum) as EyeColorEnum | null,
    hair_color: parseEnum(
      draft.hair_color,
      HairColorEnum,
    ) as HairColorEnum | null,
    birthdate: draft.birthdate,
    deathdate: draft.deathdate,
    height: Number.parseInt(draft.height ?? "") || null,
    country: draft?.country?.length === 2 ? draft.country : null,
    aliases: draftAliases ?? existingPerformer?.aliases,
    career_start_year:
      draft?.career_start_year ?? existingPerformer?.career_start_year,
    career_end_year:
      draft?.career_end_year ?? existingPerformer?.career_end_year,
    breast_type:
      parseBreastType(draft?.breast_type) ?? existingPerformer?.breast_type,
    band_size: measurements?.band ?? existingPerformer?.band_size,
    waist_size: measurements?.waist ?? existingPerformer?.waist_size,
    hip_size: measurements?.hip ?? existingPerformer?.hip_size,
    cup_size: measurements?.cup ?? existingPerformer?.cup_size,
    tattoos: existingPerformer?.tattoos ?? undefined,
    piercings: existingPerformer?.piercings ?? undefined,
    urls: joinURLs(mappedUrls, existingPerformer?.urls),
  };

  const remainder = {
    Aliases: draftAliases ? null : (draft?.aliases ?? null),
    Height: draft.height && !performer.height ? draft.height : null,
    Country: draft?.country?.length !== 2 ? (draft?.country ?? null) : null,
    URLs: remainingUrls.join(", "),
    Measurements:
      draft?.measurements && !measurements ? draft.measurements : null,
    "Breast Type":
      draft?.breast_type && !parseBreastType(draft?.breast_type)
        ? draft.breast_type
        : null,
    Piercings: draft?.piercings ?? null,
    Tattoos: draft?.tattoos ?? null,
  };

  return [performer, remainder];
};
