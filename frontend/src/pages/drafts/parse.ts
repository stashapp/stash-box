import { uniqBy } from "lodash-es";
import {
  BreastTypeEnum,
  type DraftQuery,
  EthnicityEnum,
  EyeColorEnum,
  type GalleryFragment,
  GenderEnum,
  HairColorEnum,
  type PerformerFragment,
  type SceneFragment,
  type SceneQuery,
  type Site,
  ValidSiteTypeEnum,
} from "src/graphql";
import type { InitialGallery } from "src/pages/galleries/galleryForm";
import type { InitialPerformer } from "src/pages/performers/performerForm";
import type { InitialScene } from "src/pages/scenes/sceneForm";

import { cleanURL } from "src/utils";

type DraftData = NonNullable<DraftQuery["findDraft"]>["data"];
type SceneDraft = DraftData & { __typename: "SceneDraft" };
type GalleryDraft = DraftData & { __typename: "GalleryDraft" };
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
    if (url === "") continue;

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
    production_date: draft.production_date,
    title: draft.title,
    details: draft.details,
    urls: joinURLs(mappedUrls, existingScene?.urls),
    studio: draft.studio?.__typename === "Studio" ? draft.studio : null,
    director: draft.director,
    code: draft.code,
    duration: draft.fingerprints?.[0]?.duration ?? null,
    images: draft.image ? [draft.image] : existingScene?.images,
    tags: joinTags(
      (draft.tags ?? []).reduce<Tag[]>((res, t) => {
        if (t.__typename === "Tag") res.push(t);
        return res;
      }, []),
      existingScene?.tags,
    ),
    performers: joinPerformers(
      (draft.performers ?? []).reduce<ScenePerformer[]>((res, p) => {
        if (p.__typename === "Performer")
          res.push({ performer: p, as: "", __typename: "PerformerAppearance" });
        return res;
      }, []),
      existingScene?.performers,
    ),
  };

  const remainder = {
    Studio:
      draft.studio?.__typename === "DraftEntity" ? draft.studio.name : null,
    Performers: (draft.performers ?? [])
      .reduce<string[]>((res, p) => {
        if (p.__typename === "DraftEntity") res.push(p.name);
        return res;
      }, [])
      .join(", "),
    Urls: remainingUrls.join(", "),
    Tags: (draft.tags ?? [])
      .reduce<string[]>((res, t) => {
        if (t.__typename === "DraftEntity") res.push(t.name);
        return res;
      }, [])
      .join(", "),
  };

  return [scene, remainder];
};

export const parseGalleryDraft = (
  draft: GalleryDraft,
  existingGallery: GalleryFragment | undefined,
  sites: Site[],
): [InitialGallery, Record<string, string | null>] => {
  const [mappedUrls, remainingUrls] = parseUrls(
    draft.urls ?? [],
    ValidSiteTypeEnum.GALLERY,
    sites,
  );
  const resolvedTags = (draft.tags ?? []).flatMap((tag) =>
    tag.__typename === "Tag" ? [tag] : [],
  );
  const resolvedPerformers = (draft.performers ?? []).flatMap((performance) =>
    performance.__typename === "Performer"
      ? [
          {
            performer: performance,
            as: "",
            __typename: "PerformerAppearance" as const,
          },
        ]
      : [],
  );
  const resolvedScenes = (draft.scenes ?? []).flatMap((scene) =>
    scene.__typename === "Scene" ? [scene] : [],
  );

  return [
    {
      title: draft.title ?? existingGallery?.title,
      code: draft.code ?? existingGallery?.code,
      date: draft.date ?? existingGallery?.date,
      photographer: draft.photographer ?? existingGallery?.photographer,
      details: draft.details ?? existingGallery?.details,
      urls: joinURLs(mappedUrls, existingGallery?.urls),
      studio:
        draft.studio?.__typename === "Studio"
          ? draft.studio
          : existingGallery?.studio,
      cover: draft.cover ?? existingGallery?.cover,
      tags: joinTags(resolvedTags, existingGallery?.tags),
      performers: joinPerformers(
        resolvedPerformers,
        existingGallery?.performers,
      ),
      scenes: uniqBy(
        [...resolvedScenes, ...(existingGallery?.scenes ?? [])],
        (scene) => scene.id,
      ),
      images:
        draft.images.length > 0
          ? draft.images.map((image) => ({
              index: image.index,
              phash: image.phash,
              tags: image.tags.flatMap((tag) =>
                tag.__typename === "Tag" ? [tag] : [],
              ),
            }))
          : existingGallery?.images,
    },
    {
      Studio:
        draft.studio?.__typename === "DraftEntity" ? draft.studio.name : null,
      Performers: (draft.performers ?? [])
        .flatMap((performer) =>
          performer.__typename === "DraftEntity" ? [performer.name] : [],
        )
        .join(", "),
      Scenes: (draft.scenes ?? [])
        .flatMap((scene) =>
          scene.__typename === "DraftEntity" ? [scene.name] : [],
        )
        .join(", "),
      Tags: (draft.tags ?? [])
        .flatMap((tag) => (tag.__typename === "DraftEntity" ? [tag.name] : []))
        .join(", "),
      "Image Tags": draft.images
        .flatMap((image) =>
          image.tags.flatMap((tag) =>
            tag.__typename === "DraftEntity"
              ? [`${image.index}: ${tag.name}`]
              : [],
          ),
        )
        .join(", "),
      URLs: remainingUrls.join(", "),
    },
  ];
};

const parseEnum = <T extends string>(
  value: string | null | undefined,
  enumObj: Record<string, T>,
): T | null =>
  Object.entries(enumObj).find(
    ([, objVal]) => value?.toLowerCase() === objVal.toLowerCase(),
  )?.[1] ?? null;

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

const parseHairColor = (value: string | null | undefined) => {
  switch (value?.toLocaleUpperCase()) {
    case "BROWN":
    case "BRUNETTE":
      return HairColorEnum.BRUNETTE;
    case "BLONDE":
    case "BLOND":
      return HairColorEnum.BLONDE;
    default:
      return parseEnum(value, HairColorEnum);
  }
};

const parseMeasurements = (value: string | null | undefined) => {
  const parsedMeasurements = value?.match(
    /^(\d\d)([a-zA-Z]+)(?:-|\s)(\d\d)(?:-|\s)(\d\d)$/,
  );
  if (!parsedMeasurements || parsedMeasurements?.length !== 5) return null;

  return {
    band: Number.parseInt(parsedMeasurements[1], 10),
    cup: parsedMeasurements[2],
    waist: Number.parseInt(parsedMeasurements[3], 10),
    hip: Number.parseInt(parsedMeasurements[4], 10),
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
    gender: parseEnum(draft.gender, GenderEnum),
    ethnicity: parseEnum(draft.ethnicity, EthnicityEnum),
    eye_color: parseEnum(draft.eye_color, EyeColorEnum),
    hair_color: parseHairColor(draft.hair_color),
    birthdate: draft.birthdate,
    deathdate: draft.deathdate,
    height: Number.parseInt(draft.height ?? "", 10) || null,
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
